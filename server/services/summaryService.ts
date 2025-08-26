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

      const summaryPrompt = `Create a short title (max 25 chars) for this conversation. Focus on the user's main question/topic. Return ONLY the title.

Examples:
- "AI Strategy"
- "Code Help"
- "Project Plan"
- "Tech Support"

User messages:
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
        const cleanSummary = summary.replace(/^["']|["']$/g, '').substring(0, 25);
        if (cleanSummary.length > 22) {
          return cleanSummary.substring(0, 22) + '...';
        }
        return cleanSummary || await this.generateFallbackSummary(conversationMessages);
      }
      
      // Fallback to DeepSeek if OpenAI is not available
      console.log("OpenAI not available, using DeepSeek for summary generation");
      try {
        const summary = await this.generateSummaryWithDeepSeek(summaryPrompt, conversationMessages);
        if (summary && summary !== "Chat Summary" && !summary.includes("Great question about AI and business")) {
          return summary;
        }
      } catch (error) {
        console.error("Error generating summary with DeepSeek:", error);
      }
      
      // Use our improved fallback instead of problematic DeepSeek responses
      return await this.generateFallbackSummary(conversationMessages);
      
    } catch (error) {
      console.error("Error generating chat summary:", error);
      return await this.generateFallbackSummary(messages);
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
      
      // Check if the summary is valid and not a generic response
      if (summary && summary !== "Chat Summary" && !summary.includes("Great question about AI and business")) {
        return summary;
      }
      
      // Use our improved fallback instead of problematic DeepSeek responses
      return await this.generateFallbackSummary(conversationMessages);
    } catch (error) {
      console.error("Error generating summary with DeepSeek:", error);
      return await this.generateFallbackSummary(conversationMessages);
    }
  }

  private static generateFallbackSummary(messages: Array<{ role: string; content: string }>): Promise<string> {
    return new Promise((resolve) => {
      // Try to use the first user message as a summary
      const firstUserMessage = messages.find(msg => msg.role === "user");
      if (firstUserMessage && firstUserMessage.content.trim()) {
        let content = firstUserMessage.content.trim();
        
        // Extract first few words and limit to 25 characters
        const words = content.split(' ').slice(0, 4).join(' ');
        let summary = words.substring(0, 25);
        
        if (summary.length === 25 && content.length > 25) {
          summary = summary.substring(0, 22) + '...';
        }
        
        resolve(summary);
        return;
      }
      
      // If no user message, try to create a summary from the conversation
      if (messages.length > 0) {
        const firstMessage = messages[0];
        if (firstMessage.content) {
          let content = firstMessage.content.trim();
          const words = content.split(' ').slice(0, 3).join(' ');
          let summary = words.substring(0, 25);
          
          if (summary.length === 25 && content.length > 25) {
            summary = summary.substring(0, 22) + '...';
          }
          
          resolve(summary);
          return;
        }
      }
      
      resolve("New conversation");
    });
  }
}