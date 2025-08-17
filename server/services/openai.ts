import OpenAI from "openai";
import { getSecret } from "../admin";
import { storage } from "../storage"; // adjust path as needed
import { googleDriveService } from "./googleDrive";

class OpenAIService {
  private async getOpenAIClientForUser(userId: number) {
    // 1. Query the integration
    const integration = await storage.getIntegration(userId, "openai");
    if (!integration) throw new Error("No OpenAI integration found for user");
    // 2. Decrypt or parse credentials_encrypted
    const credentials = JSON.parse(integration.credentialsEncrypted);
    const apiKey = credentials.apiKey;
    if (!apiKey) throw new Error("No API key found in integration");
    // 3. Return OpenAI client
    return new OpenAI({ apiKey });
  }

  async sendMessage(
    message: string,
    userId: number,
    sessionId: string,
    googleCredentials: string,
  ) {
    const openai = await this.getOpenAIClientForUser(userId);

    try {
      // ✅ 1. Load and sanitize previous chat history from Google Drive
      let messages = await googleDriveService.getChatHistory(
        sessionId,
        googleCredentials,
      );

      // Only keep fields that OpenAI expects
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

      console.log("Sending messages to OpenAI:", messages);

      // ✅ 3. Send full chat history
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response;
    } catch (error) {
      console.error("OpenAI API error:", error);
      throw new Error("Failed to get response from OpenAI");
    }
  }

  async testApiKey(userId: number): Promise<boolean> {
    try {
      const openai = await this.getOpenAIClientForUser(userId);
      await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 1,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  calculateCost(tokens: number, model: string = "gpt-4o"): number {
    // Approximate costs per 1K tokens
    const costs: Record<string, number> = {
      "gpt-4o": 0.03,
      "gpt-4": 0.06,
      "gpt-3.5-turbo": 0.002,
    };

    return (tokens / 1000) * (costs[model] || costs["gpt-4o"]);
  }
}

export const openaiService = new OpenAIService();
