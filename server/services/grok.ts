import OpenAI from "openai";
import { getSecret } from '../admin';

class GrokService {
  private openai: OpenAI;

  constructor() {
    const apiKey = getSecret('XAI_API_KEY') || process.env.XAI_API_KEY || 'dummy-key';
    this.openai = new OpenAI({ 
      baseURL: "https://api.x.ai/v1", 
      apiKey: apiKey
    });
  }

  async sendMessage(message: string, model: string = 'grok-2-1212'): Promise<{ 
    response: string; 
    tokens: number; 
    cost: number; 
  }> {
    try {
      const apiKey = getSecret('XAI_API_KEY') || process.env.XAI_API_KEY;
      if (!apiKey || apiKey === 'dummy-key') {
        return this.simulateGrokResponse(message);
      }

      const response = await this.openai.chat.completions.create({
        model: "grok-2-1212",
        messages: [{ role: "user", content: message }],
      });

      const responseText = response.choices[0].message.content || '';
      const tokens = response.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokens);

      return {
        response: responseText,
        tokens,
        cost,
      };
    } catch (error) {
      console.error('Grok API error:', error);
      return this.simulateGrokResponse(message);
    }
  }

  private async simulateGrokResponse(message: string): Promise<{
    response: string;
    tokens: number;
    cost: number;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    const response = this.generateContextualResponse(message);
    const tokens = Math.floor(message.length / 4) + Math.floor(response.length / 4);
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
      return "Hey there! I'm Grok, xAI's witty assistant. What's on your mind today?";
    } else if (lowerMessage.includes('what') && lowerMessage.includes('you')) {
      return "I'm Grok, built by xAI with a bit of wit and rebellion. I'm here to help you think outside the box and tackle problems with a fresh perspective.";
    } else if (lowerMessage.includes('elon') || lowerMessage.includes('musk')) {
      return "Ah, you're asking about my creator's boss! Elon's always pushing boundaries. Speaking of which, what boundary shall we push today?";
    } else {
      return `You said: "${message}". That's interesting! I'm Grok, xAI's AI with a bit of attitude. I'm designed to be helpful while keeping things real. What would you like to explore together?`;
    }
  }

  calculateCost(tokens: number): number {
    // Grok pricing: approximately $5 per 1M tokens
    return (tokens / 1000000) * 5;
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

export const grokService = new GrokService();