import OpenAI from "openai";

export class SummaryService {
  private static openai: OpenAI | null = null;

  private static getOpenAI(): OpenAI {
    if (!this.openai) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API key not found in environment variables");
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

      const openai = this.getOpenAI();
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: summaryPrompt }],
        max_tokens: 100,
        temperature: 0.3,
      });
      
      // Clean up the response and ensure it's not too long
      let summary = response.choices[0]?.message?.content?.trim() || "";
      
      // Remove quotes if present
      summary = summary.replace(/^["']|["']$/g, '');
      
      // Limit to 50 characters
      if (summary.length > 50) {
        summary = summary.substring(0, 47) + '...';
      }
      
      // Fallback if empty or too short
      if (!summary || summary.length < 3) {
        const firstUserMessage = conversationMessages.find(msg => msg.role === "user");
        if (firstUserMessage) {
          summary = firstUserMessage.content.substring(0, 50);
          if (summary.length === 50) {
            summary = summary.substring(0, 47) + '...';
          }
        } else {
          summary = "New conversation";
        }
      }

      return summary;
    } catch (error) {
      console.error("Error generating chat summary:", error);
      
      // Fallback: use first user message or default
      const firstUserMessage = messages.find(msg => msg.role === "user");
      if (firstUserMessage) {
        const fallback = firstUserMessage.content.substring(0, 50);
        return fallback.length === 50 ? fallback.substring(0, 47) + '...' : fallback;
      }
      
      return "New conversation";
    }
  }
} 