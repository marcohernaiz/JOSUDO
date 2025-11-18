import OpenAI from "openai";
import { getSecret } from "../admin";
import { storage } from "../storage"; // adjust path as needed
import { googleDriveService } from "./googleDrive";
import { enhanceMessageForThinking, getModelParameters } from '../utils/messageEnhancement';

class OpenAIService {
  private static readonly DEFAULT_MODEL = "gpt-5.1";

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

      // ✅ 2. Add the new user message (handle images if present)
      const userMessage = this.parseMessageWithImages(message);
      messages.push(userMessage);

      console.log("Sending messages to OpenAI:", messages);

      // ✅ 3. Send full chat history
      const response = await openai.chat.completions.create({
        model: OpenAIService.DEFAULT_MODEL,
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

  async *sendMessageStream(
    message: string,
    userId: number,
    sessionId: string,
    googleCredentials: string,
  ): AsyncGenerator<{ content: string; tokens?: number }, void, unknown> {
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

      console.log("Sending streaming messages to OpenAI:", messages);

      // ✅ 3. Create streaming completion
      const stream = await openai.chat.completions.create({
        model: OpenAIService.DEFAULT_MODEL,
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        stream: true,
      });

      // ✅ 4. Yield streaming chunks
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield { 
            content,
            tokens: chunk.usage?.total_tokens 
          };
        }
      }
    } catch (error) {
      console.error("OpenAI streaming API error:", error);
      throw new Error("Failed to get streaming response from OpenAI");
    }
  }

  async testApiKey(userId: number): Promise<boolean> {
    try {
      const openai = await this.getOpenAIClientForUser(userId);
      await openai.chat.completions.create({
        model: OpenAIService.DEFAULT_MODEL,
        messages: [{ role: "user", content: "Hello" }],
        max_tokens: 1,
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  calculateCost(tokens: number, model: string = OpenAIService.DEFAULT_MODEL): number {
    // Approximate costs per 1K tokens
    const costs: Record<string, number> = {
      "gpt-5.1": 0.05,
      "gpt-4o": 0.03,
      "gpt-4": 0.06,
      "gpt-3.5-turbo": 0.002,
    };

    const costPerToken = costs[model] ?? costs[OpenAIService.DEFAULT_MODEL] ?? 0.03;
    return (tokens / 1000) * costPerToken;
  }

  private parseMessageWithImages(message: string): { role: "user"; content: any } {
    // Check if message contains image data
    const imageRegex = /\[Image: ([^\]]+)\]\n\nImage data: (data:[^;]+;base64,[^\s]+)/g;
    const matches = Array.from(message.matchAll(imageRegex));
    
    if (matches.length === 0) {
      // No images, return simple text message
      return {
        role: "user" as const,
        content: message,
      };
    }

    // Parse message with images
    const content: any[] = [];
    let lastIndex = 0;

    for (const match of matches) {
      const [fullMatch, imageName, imageData] = match;
      const matchIndex = message.indexOf(fullMatch, lastIndex);
      
      // Add text before image
      if (matchIndex > lastIndex) {
        const textBefore = message.substring(lastIndex, matchIndex).trim();
        if (textBefore) {
          content.push({
            type: "text",
            text: textBefore,
          });
        }
      }

      // Add image
      content.push({
        type: "image_url",
        image_url: {
          url: imageData,
        },
      });

      lastIndex = matchIndex + fullMatch.length;
    }

    // Add remaining text after last image
    if (lastIndex < message.length) {
      const textAfter = message.substring(lastIndex).trim();
      if (textAfter) {
        content.push({
          type: "text",
          text: textAfter,
        });
      }
    }

    return {
      role: "user" as const,
      content: content,
    };
  }
}

export const openaiService = new OpenAIService();
