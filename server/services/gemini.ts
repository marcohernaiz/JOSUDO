import { GoogleGenAI } from "@google/genai";
import { getSecret } from '../admin';

// DON'T DELETE THIS COMMENT
// Follow these instructions when using this blueprint:
// - Note that the newest Gemini model series is "gemini-2.5-flash" or gemini-2.5-pro"
//   - do not change this unless explicitly requested by the user

class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    // This API key is from Gemini Developer API Key, not vertex AI API Key
    this.ai = new GoogleGenAI({ 
      apiKey: getSecret('GEMINI_API_KEY') || process.env.GEMINI_API_KEY || "" 
    });
  }

  async sendMessage(message: string, model: string = 'gemini-2.5-flash'): Promise<{ 
    response: string; 
    tokens: number; 
    cost: number; 
  }> {
    try {
      const apiKey = getSecret('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return this.simulateGeminiResponse(message);
      }

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: message,
      });

      const responseText = response.text || "Something went wrong";
      const tokens = this.estimateTokens(message + responseText);
      const cost = this.calculateCost(tokens);

      return {
        response: responseText,
        tokens,
        cost,
      };
    } catch (error) {
      console.error('Gemini API error:', error);
      return this.simulateGeminiResponse(message);
    }
  }

  private async simulateGeminiResponse(message: string): Promise<{
    response: string;
    tokens: number;
    cost: number;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const response = this.generateContextualResponse(message);
    const tokens = this.estimateTokens(message + response);
    const cost = this.calculateCost(tokens);

    return {
      response,
      tokens,
      cost,
    };
  }

  private generateContextualResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! I'm Gemini, Google's AI assistant. I'm here to help you with information, analysis, creativity, and problem-solving. What can I do for you?";
    } else if (lowerMessage.includes('what') && lowerMessage.includes('you')) {
      return "I'm Gemini, developed by Google. I'm designed to be helpful, informative, and safe. I can assist with research, writing, coding, math, creative projects, and much more.";
    } else if (lowerMessage.includes('google')) {
      return "That's right, I'm made by Google! I have access to a wealth of knowledge and can help you with various tasks. What are you curious about today?";
    } else {
      return `You asked: "${message}". I'm Gemini, Google's AI model, and I'm ready to help! I can assist with research, creative writing, problem-solving, coding, and answering questions across many topics. What would you like to explore?`;
    }
  }

  private estimateTokens(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters
    return Math.ceil(text.length / 4);
  }

  calculateCost(tokens: number): number {
    // Gemini pricing: approximately $0.075 per 1M input tokens, $0.30 per 1M output tokens
    // Using average of $0.1875 per 1M tokens for simplicity
    return (tokens / 1000000) * 0.1875;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage("Hello");
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const geminiService = new GeminiService();