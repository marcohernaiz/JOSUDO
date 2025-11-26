import { getSecret } from "../admin";

interface CreateRealtimeSessionOptions {
  voice?: string;
  model?: string;
  instructions?: string;
  apiKey?: string;
}

class OpenAIRealtimeService {
  private readonly defaultModel = "gpt-4o-realtime-preview-2024-12-18";
  private readonly defaultVoice = "alloy";

  private getDefaultApiKey(): string {
    const apiKey =
      getSecret("OPENAI_API_KEY") || process.env.OPENAI_API_KEY || "";

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not configured. Voice mode requires a platform OpenAI key.",
      );
    }

    return apiKey;
  }

  async createSession(options?: CreateRealtimeSessionOptions) {
    const apiKey = options?.apiKey || this.getDefaultApiKey();
    const model = options?.model || this.defaultModel;
    const voice = options?.voice || this.defaultVoice;

    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice,
        modalities: ["text", "audio"],
        input_audio_format: "pcm16",
        output_audio_format: "pcm16",
        instructions:
          options?.instructions ||
          "You are Josudo's friendly voice companion. Keep responses clear, concise, and conversational.",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to create OpenAI Realtime session: ${response.status} ${response.statusText} - ${errorText}`,
      );
    }

    return response.json();
  }
}

export const openaiRealtimeService = new OpenAIRealtimeService();

