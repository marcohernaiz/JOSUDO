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

        switch (data.type) {
          case "response.output_text.delta":
            appendResponseDelta(data.delta || "");
            break;
          case "response.output_text.done":
          case "response.completed":
            finalizeResponse();
            break;
          case "response.refusal.delta":
            appendResponseDelta(data.delta || "");
            break;
          case "error":
            setError(
              data.error?.message || "Realtime session reported an error.",
            );
            setStatus("error");
            break;
          default:
            break;
        }
      } catch {
        // Non-JSON messages are metadata we can ignore
      }
    },
    [appendResponseDelta, finalizeResponse],
  );

  const startSession = useCallback(async () => {
    if (status === "connecting") return;
    if (!canUseMediaDevices) {
      setError("Microphone access is not supported in this browser.");
      setStatus("error");
      return;
    }

    setError(null);
    setStatus("connecting");
    setResponses([]);
    setPartialResponse("");
    partialResponseRef.current = "";

    try {
      const tokenResponse = await fetch("/api/voice/realtime-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!tokenResponse.ok) {
        const errorPayload = await tokenResponse.json().catch(() => null);
        throw new Error(
          errorPayload?.error ||
            `Unable to create voice session (${tokenResponse.status})`,
        );
      }

      const sessionData: SessionResponse = await tokenResponse.json();

      if (!sessionData.clientSecret) {
        throw new Error(
          "Voice session started but client credentials were not returned.",
        );
      }

      setSessionInfo(sessionData);

      const pc = new RTCPeerConnection({
        iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
      });
      peerConnectionRef.current = pc;

      pc.ontrack = (event) => {
        const stream = event.streams[0];
        if (stream && remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.muted = isRemoteAudioMuted;
          remoteAudioRef.current
            .play()
            .catch(() =>
              console.warn("Autoplay blocked. User interaction may be required."),
            );
        }
      };

      const localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      localStreamRef.current = localStream;
      localStream
        .getAudioTracks()
        .forEach((track) => pc.addTrack(track, localStream));

      const dataChannel = pc.createDataChannel("oai-events");
      dataChannelRef.current = dataChannel;
      dataChannel.onmessage = handleDataChannelMessage;
      dataChannel.onopen = () => {
        setStatus("connected");
        dataChannel.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions:
                "You are Josudo's real-time voice assistant. Respond naturally, keep answers concise, and wait for the user's voice before replying.",
              modalities: ["text", "audio"],
            },
          }),
        );
      };

      dataChannel.onerror = (event) => {
        console.error("Realtime data channel error", event);
        setError("Realtime data channel encountered an error.");
        setStatus("error");
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await waitForIceGatheringComplete(pc);

      const model = sessionData.model || "gpt-4o-realtime-preview-2024-12-18";
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

      if (!sdpResponse.ok) {
        throw new Error(
          `Failed to complete WebRTC handshake (${sdpResponse.status})`,
        );
      }

      const answer = await sdpResponse.text();
      await pc.setRemoteDescription({ type: "answer", sdp: answer });
    } catch (err) {
      console.error("Failed to start voice session", err);
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
        return "Live conversation is active.";
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

