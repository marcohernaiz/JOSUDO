import OpenAI from "openai";
import { getSecret } from "../admin";
import { deepseekService } from "./deepseek";

export class SummaryService {
  private static openai: OpenAI | null = null;

  private static getOpenAI(): OpenAI | null {
    if (!this.openai) {
      const apiKey = getSecret('OPENAI_API_KEY') || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return null; // Return null instead of throwing error
      }
      this.openai = new OpenAI({ apiKey });
    }
    return this.openai;
  }

  static async generateChatSummary(messages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      // Filter to only user and assistant messages, exclude system messages
      const conversationMessages = messages.filter(msg => 
        msg.role === "user" || msg.role === "assistant"
      );

      if (conversationMessages.length === 0) {
        return "New conversation";
      }

      // Take the first few messages to generate a summary
      const messagesToSummarize = conversationMessages.slice(0, 6);
      
      const conversationText = messagesToSummarize
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');

      const summaryPrompt = `Please provide a brief, descriptive title (maximum 50 characters) for this conversation based on the first few messages. The title should capture the main topic or theme. Return only the title, nothing else.

Conversation:
${conversationText}

Title:`;

      // Try OpenAI first if available
      const openai = this.getOpenAI();
      if (openai) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: summaryPrompt }],
          max_tokens: 100,
          temperature: 0.3,
        });
        
        // Clean up the response and ensure it's not too long
        const summary = response.choices[0]?.message?.content?.trim() || "";
        const cleanSummary = summary.replace(/^["']|["']$/g, '').substring(0, 50);
        if (cleanSummary.length > 47) {
          return cleanSummary.substring(0, 47) + '...';
        }
        return cleanSummary || this.generateFallbackSummary(conversationMessages);
      }
      
      // Fallback to DeepSeek if OpenAI is not available
      console.log("OpenAI not available, using DeepSeek for summary generation");
      return await this.generateSummaryWithDeepSeek(summaryPrompt, conversationMessages);
      
    } catch (error) {
      console.error("Error generating chat summary:", error);
      return this.generateFallbackSummary(messages);
    }
  }

  private static async generateSummaryWithDeepSeek(prompt: string, conversationMessages: Array<{ role: string; content: string }>): Promise<string> {
    try {
      // Create conversation text for DeepSeek
      const conversationText = conversationMessages
        .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');
      
      // Use DeepSeek's specialized summary generation method
      const summary = await deepseekService.generateSummary(conversationText);
      return summary || this.generateFallbackSummary(conversationMessages);
    } catch (error) {
      console.error("Error generating summary with DeepSeek:", error);
      return this.generateFallbackSummary(conversationMessages);
    }
  }

  private static generateFallbackSummary(messages: Array<{ role: string; content: string }>): string {
    // Try to use the first user message as a summary
    const firstUserMessage = messages.find(msg => msg.role === "user");
    if (firstUserMessage && firstUserMessage.content.trim()) {
      let summary = firstUserMessage.content.trim().substring(0, 50);
      if (summary.length === 50) {
        summary = summary.substring(0, 47) + '...';
      }
      return summary;
    }
    return "New conversation";
  }
}