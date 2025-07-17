import OpenAI from "openai";
import { getSecret } from "../admin";

class OpenAIService {
  private getOpenAIClient(apiKey?: string) {
    const key = apiKey || getSecret("OPENAI_API_KEY");
    if (!key) {
      throw new Error(
        "OpenAI API key not configured. Please configure it in the admin panel.",
      );
    }
    return new OpenAI({
      apiKey: key,
    });
  }

  async sendMessage(message: string, userApiKey?: string) {
    const openai = this.getOpenAIClient(userApiKey);

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

  async testApiKey(apiKey: string): Promise<boolean> {
    try {
      const openai = this.getOpenAIClient(apiKey);
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
