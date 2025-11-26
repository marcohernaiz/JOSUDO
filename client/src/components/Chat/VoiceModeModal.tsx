import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  VolumeX,
} from "lucide-react";

type VoiceStatus = "idle" | "connecting" | "connected" | "error";

interface VoiceModeModalProps {
  open: boolean;
  onClose: () => void;
}

interface SessionResponse {
  clientSecret: string;
  model?: string;
  voice?: string;
  expiresAt?: string | null;
}

const waitForIceGatheringComplete = (pc: RTCPeerConnection) =>
  new Promise<void>((resolve) => {
    if (pc.iceGatheringState === "complete") {
      resolve();
      return;
    }

    const checkState = () => {
      if (pc.iceGatheringState === "complete") {
        pc.removeEventListener("icegatheringstatechange", checkState);
        resolve();
      }
    };

    pc.addEventListener("icegatheringstatechange", checkState);

    // Safety timeout in case the ICE gathering never fires the event
    setTimeout(() => {
      pc.removeEventListener("icegatheringstatechange", checkState);
      resolve();
    }, 3000);
  });

export const VoiceModeModal: React.FC<VoiceModeModalProps> = ({
  open,
  onClose,
}) => {
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const partialResponseRef = useRef("");

  const [status, setStatus] = useState<VoiceStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [responses, setResponses] = useState<string[]>([]);
  const [partialResponse, setPartialResponse] = useState("");
  const [sessionInfo, setSessionInfo] = useState<SessionResponse | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isRemoteAudioMuted, setIsRemoteAudioMuted] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAIResponding, setIsAIResponding] = useState(false);

  const canUseMediaDevices = useMemo(
    () =>
      typeof navigator !== "undefined" &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === "function",
    [],
  );

  const resetState = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResponses([]);
    setPartialResponse("");
    partialResponseRef.current = "";
    setSessionInfo(null);
    setIsMuted(false);
    setIsRemoteAudioMuted(false);
    setIsUserSpeaking(false);
    setIsAIResponding(false);
  }, []);

  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
      remoteAudioRef.current.muted = false;
    }
  }, []);

  const handleClose = useCallback(() => {
    cleanup();
    resetState();
    onClose();
  }, [cleanup, resetState, onClose]);

  useEffect(() => {
    if (!open) {
      cleanup();
      resetState();
    }

    return () => {
      cleanup();
    };
  }, [open, cleanup, resetState]);

  const appendResponseDelta = useCallback((delta: string) => {
    if (!delta) return;
    setPartialResponse((prev) => {
      const next = prev + delta;
      partialResponseRef.current = next;
      return next;
    });
  }, []);

  const finalizeResponse = useCallback(() => {
    if (!partialResponseRef.current) {
      return;
    }

    setResponses((prev) => [...prev, partialResponseRef.current]);
    setPartialResponse("");
    partialResponseRef.current = "";
  }, []);

  const handleDataChannelMessage = useCallback(
    (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        console.log("[VoiceMode] Received event:", data.type, data);

        switch (data.type) {
          case "response.output_text.delta":
            console.log("[VoiceMode] Text delta:", data.delta);
            appendResponseDelta(data.delta || "");
            break;
          case "response.output_text.done":
            console.log("[VoiceMode] Text done");
            finalizeResponse();
            setIsAIResponding(false);
            break;
          case "response.audio_transcript.delta":
            console.log("[VoiceMode] Audio transcript delta:", data.delta);
            // Show what the AI heard
            if (data.delta) {
              appendResponseDelta(`[Heard: ${data.delta}] `);
            }
            break;
          case "response.audio_transcript.done":
            console.log("[VoiceMode] Audio transcript done:", data.transcript);
            break;
          case "response.audio.delta":
            console.log("[VoiceMode] Audio delta received");
            break;
          case "response.audio.done":
            console.log("[VoiceMode] Audio done");
            break;
          case "response.completed":
            console.log("[VoiceMode] Response completed");
            finalizeResponse();
            setIsAIResponding(false);
            break;
          case "response.created":
            console.log("[VoiceMode] Response created successfully");
            console.log("[VoiceMode] Response details:", data.response);
            // Check if response has transcription enabled
            if (data.response?.input_audio_transcription) {
              console.log("[VoiceMode] ✅ Input audio transcription is enabled in response");
            } else {
              console.log("[VoiceMode] ⚠️ Input audio transcription not enabled in response");
            }
            break;
          case "response.audio_started":
            console.log("[VoiceMode] AI started speaking");
            setIsAIResponding(true);
            break;
          case "response.audio_stopped":
            console.log("[VoiceMode] AI stopped speaking");
            setIsAIResponding(false);
            break;
          case "response.output_text.delta":
            if (!isAIResponding) {
              setIsAIResponding(true);
            }
            break;
          case "input_audio_buffer.speech_started":
            console.log("[VoiceMode] 🎤 User started speaking");
            setIsUserSpeaking(true);
            break;
          case "input_audio_buffer.speech_stopped":
            console.log("[VoiceMode] 🎤 User stopped speaking");
            setIsUserSpeaking(false);
            if (data.transcript) {
              console.log("[VoiceMode] 📝 Detected transcript:", data.transcript);
            }
            break;
          case "input_audio_buffer.committed":
            console.log("[VoiceMode] Audio buffer committed:", data);
            if (data.transcript) {
              console.log("[VoiceMode] 📝 Committed transcript:", data.transcript);
            }
            break;
          case "conversation.item.input_audio_transcription.completed":
            console.log("[VoiceMode] 📝 Transcription completed:", data.transcript);
            if (data.transcript) {
              appendResponseDelta(`[You said: ${data.transcript}] `);
            }
            break;
          case "conversation.item.created":
            console.log("[VoiceMode] Conversation item created:", JSON.stringify(data.item, null, 2));
            // Check if this item contains transcription
            const item = data.item;
            if (item?.type === "message" && item?.content) {
              const content = item.content;
              console.log("[VoiceMode] Item content:", JSON.stringify(content, null, 2));
              
              if (Array.isArray(content)) {
                content.forEach((part: any) => {
                  console.log("[VoiceMode] Content part:", part);
                  if (part.type === "input_text" && part.text) {
                    console.log("[VoiceMode] 📝 Found transcription in array:", part.text);
                    appendResponseDelta(`[You said: ${part.text}] `);
                  } else if (part.type === "text" && part.text) {
                    console.log("[VoiceMode] 📝 Found text in array:", part.text);
                    appendResponseDelta(`[You said: ${part.text}] `);
                  }
                });
              } else if (typeof content === "object") {
                if (content.type === "input_text" && content.text) {
                  console.log("[VoiceMode] 📝 Found transcription:", content.text);
                  appendResponseDelta(`[You said: ${content.text}] `);
                } else if (content.type === "text" && content.text) {
                  console.log("[VoiceMode] 📝 Found text:", content.text);
                  appendResponseDelta(`[You said: ${content.text}] `);
                } else if (content.text) {
                  console.log("[VoiceMode] 📝 Found text in content:", content.text);
                  appendResponseDelta(`[You said: ${content.text}] `);
                }
              } else if (typeof content === "string") {
                console.log("[VoiceMode] 📝 Content is string:", content);
                appendResponseDelta(`[You said: ${content}] `);
              }
            } else if (item?.type === "input_audio" && item?.transcript) {
              console.log("[VoiceMode] 📝 Found transcript in input_audio item:", item.transcript);
              appendResponseDelta(`[You said: ${item.transcript}] `);
            }
            break;
          case "response.refusal.delta":
            console.log("[VoiceMode] Refusal delta:", data.delta);
            appendResponseDelta(data.delta || "");
            break;
          case "error":
            console.error("[VoiceMode] Error event:", data.error);
            setError(
              data.error?.message || "Realtime session reported an error.",
            );
            setStatus("error");
            break;
          case "response.done":
            console.log("[VoiceMode] Response done:", data.response);
            if (data.response?.status === "failed") {
              console.error("[VoiceMode] ❌ Response failed:", data.response.status_details);
              setError(`Response failed: ${JSON.stringify(data.response.status_details)}`);
            }
            setIsAIResponding(false);
            break;
          case "session.created":
            console.log("[VoiceMode] Session created:", data.session);
            break;
          default:
            console.log("[VoiceMode] Unhandled event type:", data.type, data);
            break;
        }
      } catch (err) {
        // Non-JSON messages are metadata we can ignore
        console.log("[VoiceMode] Non-JSON message (ignored):", event.data);
      }
    },
    [appendResponseDelta, finalizeResponse],
  );

  const startSession = useCallback(async () => {
    if (status === "connecting") {
      console.log("[VoiceMode] Already connecting, ignoring duplicate start");
      return;
    }
    if (!canUseMediaDevices) {
      console.error("[VoiceMode] Media devices not supported");
      setError("Microphone access is not supported in this browser.");
      setStatus("error");
      return;
    }

    console.log("[VoiceMode] Starting voice session...");
    setError(null);
    setStatus("connecting");
    setResponses([]);
    setPartialResponse("");
    partialResponseRef.current = "";

    try {
      console.log("[VoiceMode] Step 1: Requesting session token from backend...");
      const tokenResponse = await fetch("/api/voice/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      console.log("[VoiceMode] Token response status:", tokenResponse.status);

      if (!tokenResponse.ok) {
        const errorPayload = await tokenResponse.json().catch(() => null);
        console.error("[VoiceMode] Token request failed:", errorPayload);
        throw new Error(
          errorPayload?.error ||
            `Unable to create voice session (${tokenResponse.status})`,
        );
      }

      const sessionData: SessionResponse = await tokenResponse.json();
      console.log("[VoiceMode] Session data received:", {
        hasClientSecret: !!sessionData.clientSecret,
        model: sessionData.model,
        voice: sessionData.voice,
      });

      if (!sessionData.clientSecret) {
        throw new Error(
          "Voice session started but client credentials were not returned.",
        );
      }

      setSessionInfo(sessionData);

      console.log("[VoiceMode] Step 2: Creating RTCPeerConnection...");
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      });
      peerConnectionRef.current = pc;

      pc.oniceconnectionstatechange = () => {
        console.log("[VoiceMode] ICE connection state:", pc.iceConnectionState);
        if (pc.iceConnectionState === "failed" || pc.iceConnectionState === "disconnected") {
          setError(`Connection ${pc.iceConnectionState}. Please try again.`);
          setStatus("error");
        }
      };

      pc.ontrack = (event) => {
        console.log("[VoiceMode] Received remote audio track");
        const stream = event.streams[0];
        if (stream && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.muted = isRemoteAudioMuted;
          remoteAudioRef.current
            .play()
            .then(() => {
              console.log("[VoiceMode] Remote audio playback started");
            })
            .catch((err) => {
              console.error("[VoiceMode] Autoplay blocked:", err);
              setError("Please click anywhere to enable audio playback.");
            });
        }
      };

      console.log("[VoiceMode] Step 3: Requesting microphone access...");
      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      console.log("[VoiceMode] Microphone access granted");
      localStreamRef.current = localStream;
      localStream
        .getAudioTracks()
        .forEach((track) => {
          console.log("[VoiceMode] Adding audio track to peer connection");
          pc.addTrack(track, localStream);
        });

      console.log("[VoiceMode] Step 4: Creating data channel...");
      const dataChannel = pc.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;
      dataChannel.onmessage = handleDataChannelMessage;
      
      dataChannel.onopen = () => {
        console.log("[VoiceMode] Data channel opened - connection established!");
        setStatus("connected");
        
        // Create the response with proper configuration
        // Transcription happens automatically when audio is processed
        dataChannel.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                "You are Josudo's real-time voice assistant. Respond naturally, keep answers concise, and wait for the user's voice before replying. When the user speaks, respond conversationally.",
              modalities: ["text", "audio"],
              voice: sessionData.voice || "alloy",
            },
          }),
        );
        console.log("[VoiceMode] Sent response.create event - AI should now be listening to your microphone");
      };

      dataChannel.onerror = (event) => {
        console.error("[VoiceMode] Data channel error:", event);
        setError("Realtime data channel encountered an error.");
        setStatus("error");
      };

      dataChannel.onclose = () => {
        console.log("[VoiceMode] Data channel closed");
      };

      console.log("[VoiceMode] Step 5: Creating WebRTC offer...");
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log("[VoiceMode] Waiting for ICE gathering...");
      await waitForIceGatheringComplete(pc);
      console.log("[VoiceMode] ICE gathering complete");

      const model = sessionData.model || "gpt-4o-realtime-preview";
      console.log("[VoiceMode] Step 6: Sending SDP to OpenAI Realtime API...", { model });
      const sdpResponse = await fetch(
        `https://api.openai.com/v1/realtime?model=${encodeURIComponent(model)}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionData.clientSecret}`,
            "Content-Type": "application/sdp",
          },
          body: pc.localDescription?.sdp,
        },
      );

      console.log("[VoiceMode] SDP response status:", sdpResponse.status);

      if (!sdpResponse.ok) {
        const errorText = await sdpResponse.text();
        console.error("[VoiceMode] SDP handshake failed:", errorText);
        throw new Error(
          `Failed to complete WebRTC handshake (${sdpResponse.status}): ${errorText}`,
        );
      }

      const answer = await sdpResponse.text();
      console.log("[VoiceMode] Step 7: Setting remote description...");
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
      console.log("[VoiceMode] WebRTC connection established successfully!");
    } catch (err) {
      console.error("[VoiceMode] Failed to start voice session:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start voice session.",
      );
      setStatus("error");
      cleanup();
    }
  }, [
    status,
    canUseMediaDevices,
    handleDataChannelMessage,
    cleanup,
    isRemoteAudioMuted,
  ]);

  const stopSession = useCallback(() => {
    cleanup();
    resetState();
  }, [cleanup, resetState]);

  const toggleMute = () => {
    if (!localStreamRef.current) return;
    const nextMuted = !isMuted;
    localStreamRef.current
      .getAudioTracks()
      .forEach((track) => (track.enabled = !nextMuted));
    setIsMuted(nextMuted);
  };

  const toggleRemoteAudio = () => {
    if (!remoteAudioRef.current) return;
    const nextMuted = !isRemoteAudioMuted;
    remoteAudioRef.current.muted = nextMuted;
    setIsRemoteAudioMuted(nextMuted);
  };

  const renderStatus = () => {
    switch (status) {
      case "connecting":
        return "Connecting to OpenAI Realtime…";
      case "connected":
        if (isUserSpeaking) {
          return "🎤 You're speaking...";
        } else if (isAIResponding) {
          return "🤖 AI is responding...";
        } else {
          return "✅ Live conversation is active. Start speaking!";
        }
      case "error":
        return "Something went wrong. Please try again.";
      default:
        return "Click start to begin a live voice conversation.";
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          handleClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Voice Mode (Beta)</DialogTitle>
          <DialogDescription>
            Stream your microphone to GPT-4o Realtime and hear responses back.
            Grant microphone access when prompted.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 px-4 py-3">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {renderStatus()}
            </p>
            {sessionInfo?.model && (
              <p className="mt-1 text-xs text-slate-500">
                Model: {sessionInfo.model} · Voice:{" "}
                {sessionInfo.voice || "alloy"}
              </p>
            )}
          </div>

          <div className="rounded-lg border border-slate-200 dark:border-slate-700 h-48 overflow-y-auto p-3 text-sm text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-900/60">
            {responses.length === 0 && !partialResponse && (
              <p className="text-slate-500">
                Transcripts will appear here. Start speaking after you hear the
                tone.
              </p>
            )}
            {responses.map((line, idx) => (
              <p key={`line-${idx}`} className="mb-2">
                {line}
              </p>
            ))}
            {partialResponse && (
              <p className="text-blue-500 animate-pulse">{partialResponse}</p>
            )}
          </div>

          <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />

          {error && (
            <div className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {status !== "connected" ? (
              <Button
                onClick={startSession}
                disabled={status === "connecting"}
                className="flex items-center gap-2"
              >
                {status === "connecting" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting…
                  </>
                ) : (
                  <>
                    <Mic className="h-4 w-4" />
                    Start conversation
                  </>
                )}
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={toggleMute}
                  className="flex items-center gap-2"
                >
                  {isMuted ? (
                    <>
                      <MicOff className="h-4 w-4" />
                      Unmute mic
                    </>
                  ) : (
                    <>
                      <Mic className="h-4 w-4" />
                      Mute mic
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={toggleRemoteAudio}
                  className="flex items-center gap-2"
                >
                  {isRemoteAudioMuted ? (
                    <>
                      <VolumeX className="h-4 w-4" />
                      Speaker muted
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-4 w-4" />
                      Speaker on
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={stopSession}
                  className="flex items-center gap-2"
                >
                  <PhoneOff className="h-4 w-4" />
                  End conversation
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={handleClose}
              className="flex items-center gap-2 ml-auto"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

