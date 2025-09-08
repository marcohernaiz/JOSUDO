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

    async sendMessage(
    message: string, 
    model: string = 'grok-2-1212',
    conversationHistory: Array<{ role: string; content: string }> = [],
    options: {
      thinkingMode?: 'fast' | 'deep' | 'research';
      webSearch?: boolean;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<{
    response: string;
    tokens: number;
    cost: number;
  }> {
    try {
      const apiKey = getSecret('XAI_API_KEY') || process.env.XAI_API_KEY;
      if (!apiKey || apiKey === 'dummy-key') {
        return this.simulateGrokResponse(message);
      }

      // Parse message for images and prepare content
      const parsedMessage = this.parseMessageWithImages(message);

      // Prepare messages array with conversation history
      const messages = [
        ...conversationHistory.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
        { role: 'user' as const, content: parsedMessage }
      ];

      const response = await this.openai.chat.completions.create({
        model: "grok-2-1212",
        messages,
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
      return this.simulateGrokResponse(message, conversationHistory);
    }
  }

  async *sendMessageStream(
    message: string, 
    model: string = 'grok-2-1212',
    conversationHistory: Array<{ role: string; content: string }> = [],
    options: {
      thinkingMode?: 'fast' | 'deep' | 'research';
      webSearch?: boolean;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): AsyncGenerator<{ content: string; tokens?: number }, void, unknown> {
    try {
      const apiKey = getSecret('XAI_API_KEY') || process.env.XAI_API_KEY;
      if (!apiKey || apiKey === 'dummy-key') {
        // Simulate streaming for fake responses
        const fakeResponse = await this.simulateGrokResponse(message, conversationHistory);
        const words = fakeResponse.response.split(' ');
        for (const word of words) {
          yield { content: word + ' ' };
          await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
        }
        return;
      }

      // Parse message for images and prepare content
      const parsedMessage = this.parseMessageWithImages(message);

      // Prepare messages array with conversation history
      const messages = [
        ...conversationHistory.map(msg => ({ role: msg.role as 'user' | 'assistant', content: msg.content })),
        { role: 'user' as const, content: parsedMessage }
      ];

      const stream = await this.openai.chat.completions.create({
        model: "grok-2-1212",
        messages,
        stream: true,
      });

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
      console.error('Grok streaming API error:', error);
      // Fallback to simulated streaming
      const fakeResponse = await this.simulateGrokResponse(message, conversationHistory);
      const words = fakeResponse.response.split(' ');
      for (const word of words) {
        yield { content: word + ' ' };
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  private async simulateGrokResponse(
    message: string,
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<{
    response: string;
    tokens: number;
    cost: number;
  }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Combine conversation history with current message for context
    const fullContext = conversationHistory.length > 0 
      ? `${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${message}`
      : message;
    
    const response = this.generateContextualResponse(fullContext);
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
    
    // Handle greetings
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return "Hey there! I'm Grok, xAI's witty assistant. What's on your mind today?";
    }
    
    // Handle questions about identity
    if (lowerMessage.includes('what') && (lowerMessage.includes('you') || lowerMessage.includes('grok'))) {
      return "I'm Grok, built by xAI with a bit of wit and rebellion. I'm here to help you think outside the box and tackle problems with a fresh perspective.";
    }
    
    // Handle questions about capabilities
    if (lowerMessage.includes('what') && lowerMessage.includes('can') && lowerMessage.includes('you')) {
      return "I can help you with a wide range of tasks! I can answer questions, help with analysis, creative writing, coding, problem-solving, and much more. I'm designed to be helpful while keeping things real and adding a bit of wit. What would you like to work on?";
    }
    
    // Handle questions about Josudo
    if (lowerMessage.includes('josudo')) {
      return "Josudo appears to be the AI assistant platform you're using right now! It's a pretty slick interface that lets you chat with different AI models like me. It seems designed to give you access to various AI capabilities in one place. Are you testing out the platform's features?";
    }
    
    // Handle questions about knowledge or knowing things
    if (lowerMessage.includes('do you know') || lowerMessage.includes('know what')) {
      return "I have knowledge up to my training cutoff, so I can help with many topics, but I might not know about very recent events or specific proprietary systems. What specifically were you curious about? I'll do my best to help or let you know if something's outside my knowledge.";
    }
    
    // Handle questions about help
    if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
      return "I'm here to help! I can assist with analysis, writing, coding, problem-solving, creative tasks, research, and much more. I approach things with a mix of helpfulness and wit. What would you like to tackle together?";
    }
    
    // Handle Elon/Musk references
    if (lowerMessage.includes('elon') || lowerMessage.includes('musk')) {
      return "Ah, you're asking about my creator's boss! Elon's always pushing boundaries. Speaking of which, what boundary shall we push today?";
    }
    
    // Default response that acknowledges the input
    return `I hear you! "${message}" - that's an interesting point. I'm Grok, and I'm here to help with whatever you'd like to explore. What would you like to dive into?`;
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

  private enhanceMessageForThinking(message: string, options: {
    thinkingMode?: 'fast' | 'deep' | 'research';
    webSearch?: boolean;
  }): string {
    let enhancedMessage = message;
    
    if (options.thinkingMode === 'deep') {
      enhancedMessage = `Please think deeply and thoroughly about this question. Take your time to analyze all aspects, consider multiple perspectives, and provide a comprehensive response. Here's the question: ${message}`;
    } else if (options.thinkingMode === 'research') {
      enhancedMessage = `Please conduct thorough research and provide a detailed, well-researched response. Consider multiple sources, analyze different viewpoints, and provide evidence-based insights. Here's the research topic: ${message}`;
    }
    
    if (options.webSearch) {
      enhancedMessage += `\n\nPlease search for the most current information available and provide up-to-date insights.`;
    }
    
    return enhancedMessage;
  }

  private parseMessageWithImages(message: string): any {
    // Check if message contains image data
    const imageRegex = /\[Image: ([^\]]+)\]\n\nImage data: (data:[^;]+;base64,[^\s]+)/g;
    const matches = Array.from(message.matchAll(imageRegex));
    
    if (matches.length === 0) {
      // No images, return simple text message
      return message;
    }

    // For Grok/xAI API, format images similar to OpenAI format
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

    return content;
  }
}

export const grokService = new GrokService();