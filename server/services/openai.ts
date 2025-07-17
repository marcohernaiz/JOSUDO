import OpenAI from "openai";
import { getSecret } from "../admin";
import { storage } from "../storage"; // adjust path as needed

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

  async sendMessage(message: string, userId: number) {
    const openai = await this.getOpenAIClientForUser(userId);

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: message,
          },
        ],
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
    const costs = {
      "gpt-4o": 0.03,
      "gpt-4": 0.06,
      "gpt-3.5-turbo": 0.002,
    };

    return (tokens / 1000) * (costs[model] || costs["gpt-4o"]);
  }
}

export const openaiService = new OpenAIService();
