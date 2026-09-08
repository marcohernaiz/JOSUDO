# JOSUDO → OPI Memory Gateway

## Purpose

JOSUDO is the universal memory gateway between AI interfaces/models and Marco's OPI knowledge system.

The architectural rule is:

> Every interaction entering or leaving JOSUDO MUST generate a durable, immutable Raw event before the interaction is considered successfully processed.

Conversation capture is a gateway responsibility, not an LLM responsibility.

## Canonical architecture

```text
ChatGPT / Claude / Gemini / Siri / other interfaces
                         |
                         v
                 JOSUDO Gateway
                         |
             +-----------+-----------+
             |                       |
             v                       v
          OPI Raw               Model Router
       immutable source      GPT / Claude / Gemini /
             |               local / other models
             |
       async ingestion
             |
             v
        OPI Second Brain
       canonical knowledge
```

## Capture invariant

1. Every inbound user interaction receives a `conversation_id`, `event_id`, timestamp, source/interface, model (when known), and sequence number.
2. The raw event is persisted through a durable outbox before processing is considered successful.
3. Model execution is independent of whether the LLM itself remembers to save anything.
4. Outbox delivery to OPI Raw is retryable and idempotent.
5. An `event_id` prevents duplicate persistence.
6. If OPI Raw is temporarily unavailable, the event remains durably queued; JOSUDO must never report successful capture when persistence has not succeeded.
7. Raw content is preserved without summarisation or reinterpretation.
8. OPI Brain is derived from Raw through ingestion/compression and retains provenance to the originating Raw artifact.

## Event model

Recommended event types:

- `conversation.started`
- `message.user`
- `message.assistant`
- `tool.called`
- `tool.result`
- `conversation.ended`

This allows an exact conversation transcript to be reconstructed without making the final LLM response responsible for capture.

## OPI Raw

`opi-raw` is the immutable evidence/source layer. Its documented layout includes `feeds/conversations/<provider>/` for continuous conversation sources. Raw artifacts are write-once and addressed by deterministic IDs.

Current providers include ChatGPT, Claude, Gemini and Grok; additional interfaces such as Siri should use the same gateway event contract.

## OPI Second Brain

`opi-brain` is the structured knowledge layer. Facts, decisions, entities and projects are derived from Raw and should reference their source artifact. Platform-native AI memories are not authoritative.

## Security and governance

JOSUDO should be the policy enforcement point for authentication, authorization, provenance, retention, audit logging, provider routing and Raw/Brain access. AI providers should be treated as clients or execution engines, not owners of canonical memory.

## Minimum gateway API

Conceptually:

```text
POST /memory/conversations/events
POST /memory/conversations/finalize
GET  /memory/conversations/{conversation_id}/status
```

The gateway should expose an equivalent MCP tool surface where appropriate, for example:

```text
josudo.capture_event()
josudo.finalize_conversation()
josudo.capture_status()
```

The capture operation must be available independently of model selection.
