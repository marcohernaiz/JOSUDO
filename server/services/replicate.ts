import Replicate from "replicate";
import { storage } from "../storage";
import { googleDriveService } from "./googleDrive";

class ReplicateService {
  private async getReplicateClientForUser(userId: number) {
    // 1. Query the integration
    const integration = await storage.getIntegration(userId, "replicate");
    if (!integration) throw new Error("No Replicate integration found for user");
    
    // 2. Decrypt or parse credentials_encrypted
    const credentials = JSON.parse(integration.credentialsEncrypted);
    const apiKey = credentials.apiKey;
    if (!apiKey) throw new Error("No API key found in integration");
    
    // 3. Return Replicate client
    return new Replicate({ auth: apiKey });
  }

  async sendMessage(
    message: string,
    userId: number,
    sessionId: string,
    googleCredentials: string,
  ) {
    const replicate = await this.getReplicateClientForUser(userId);

    try {
      // ✅ 1. Load and sanitize previous chat history from Google Drive
      let messages = await googleDriveService.getChatHistory(
        sessionId,
        googleCredentials,
      );

      // Only keep fields that Replicate expects
      messages = messages
        .filter(
          (msg) =>
            msg.role === "user" ||
            msg.role === "assistant" ||
            msg.role === "system",
        )
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // ✅ 2. Add the new user message
      messages.push({
        role: "user",
        content: message,
      });

      console.log("Sending messages to Replicate:", messages);

      // ✅ 3. Send full chat history using Llama 3.1 8B model
      const output = await replicate.run(
        "meta/llama-3.1-8b-instruct:6bc336418fcb7b2b3c0db7c1dffcb866a74eb6934a473cde74d11e8c87fed2948",
        {
          input: {
            prompt: this.formatMessagesForLlama(messages),
            max_new_tokens: 1000,
            temperature: 0.7,
            top_p: 0.9,
            top_k: 50,
            repetition_penalty: 1.1,
          }
        }
      );

      // Replicate returns an array, we need to join it
      const response = Array.isArray(output) ? output.join('') : output;

      return {
        choices: [
          {
            message: {
              content: response,
              role: "assistant"
            }
          }
        ]
      };
    } catch (error) {
      console.error("Replicate API error:", error);
      throw new Error("Failed to get response from Replicate");
    }
  }

  private formatMessagesForLlama(messages: Array<{ role: string; content: string }>): string {
    // Format messages for Llama 3.1 instruction format
    let formattedPrompt = "";
    
    for (const message of messages) {
      if (message.role === "system") {
        formattedPrompt += `<|system|>\n${message.content}\n<|/system|>\n\n`;
      } else if (message.role === "user") {
        formattedPrompt += `<|user|>\n${message.content}\n<|/user|>\n\n`;
      } else if (message.role === "assistant") {
        formattedPrompt += `<|assistant|>\n${message.content}\n<|/assistant|>\n\n`;
      }
    }
    
    formattedPrompt += "<|assistant|>\n";
    return formattedPrompt;
  }

  async testApiKey(userId: number): Promise<boolean> {
    try {
      const replicate = await this.getReplicateClientForUser(userId);
      await replicate.run(
        "meta/llama-3.1-8b-instruct:6bc336418fcb7b2b3c0db7c1dffcb866a74eb6934a473cde74d11e8c87fed2948",
        {
          input: {
            prompt: "Hello",
            max_new_tokens: 1,
          }
        }
      );
      return true;
    } catch (error) {
      return false;
    }
  }

  calculateCost(tokens: number, model: string = "llama-3.1-8b"): number {
    // Replicate pricing (approximate costs per 1K tokens)
    const costs = {
      "llama-3.1-8b": 0.0002, // $0.0002 per 1K tokens
      "llama-3.1-70b": 0.001,  // $0.001 per 1K tokens
      "llama-2-70b": 0.0007,   // $0.0007 per 1K tokens
      "codellama-34b": 0.0005, // $0.0005 per 1K tokens
    };

    return (tokens / 1000) * (costs[model as keyof typeof costs] || costs["llama-3.1-8b"]);
  }
}

export const replicateService = new ReplicateService();
