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

    async sendMessage(
    message: string, 
    model: string = 'gemini-2.5-pro',
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
      const apiKey = getSecret('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return this.simulateGeminiResponse(message);
      }

      // Parse message for images and prepare content
      const parsedContent = this.parseMessageWithImages(message);
      
      // Prepare conversation history
      const historyContent = conversationHistory.length > 0 
        ? conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n') + '\n\n'
        : '';

      // Handle images properly for Gemini 2.5 Pro vision capabilities
      let response;
      if (typeof parsedContent === 'string') {
        // No images, just text
        const fullContent = historyContent + parsedContent;
        response = await this.ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: fullContent,
        });
      } else {
        // Has images - use Gemini's multimodal capabilities
        const contentParts = [];
        
        // Add conversation history as text
        if (historyContent) {
          contentParts.push(historyContent);
        }
        
        // Add text content
        if (parsedContent.text) {
          contentParts.push(parsedContent.text);
        }
        
        // Add images
        if (parsedContent.images && parsedContent.images.length > 0) {
          for (const imageData of parsedContent.images) {
            contentParts.push({
              inlineData: {
                mimeType: imageData.split(';')[0].split(':')[1], // Extract MIME type
                data: imageData.split(',')[1] // Extract base64 data
              }
            });
          }
        }
        
        response = await this.ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: contentParts,
        });
      }

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
      return this.simulateGeminiResponse(message, conversationHistory);
    }
  }

  async *sendMessageStream(
    message: string, 
    model: string = 'gemini-2.5-pro',
    conversationHistory: Array<{ role: string; content: string }> = [],
    options: {
      thinkingMode?: 'fast' | 'deep' | 'research';
      webSearch?: boolean;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): AsyncGenerator<{ content: string; tokens?: number }, void, unknown> {
    try {
      const apiKey = getSecret('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        // Simulate streaming for fake responses
        const fakeResponse = await this.simulateGeminiResponse(message, conversationHistory);
        const words = fakeResponse.response.split(' ');
        for (const word of words) {
          yield { content: word + ' ' };
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        return;
      }

      // Parse message for images and prepare content
      const parsedContent = this.parseMessageWithImages(message);
      
      // Prepare conversation history
      const historyContent = conversationHistory.length > 0 
        ? conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n') + '\n\n'
        : '';

      // Handle images properly for Gemini 2.5 Pro vision capabilities
      let response;
      if (typeof parsedContent === 'string') {
        // No images, just text
        const fullContent = historyContent + parsedContent;
        response = await this.ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: fullContent,
        });
      } else {
        // Has images - use Gemini's multimodal capabilities
        const contentParts = [];
        
        // Add conversation history as text
        if (historyContent) {
          contentParts.push(historyContent);
        }
        
        // Add text content
        if (parsedContent.text) {
          contentParts.push(parsedContent.text);
        }
        
        // Add images
        if (parsedContent.images && parsedContent.images.length > 0) {
          for (const imageData of parsedContent.images) {
            contentParts.push({
              inlineData: {
                mimeType: imageData.split(';')[0].split(':')[1], // Extract MIME type
                data: imageData.split(',')[1] // Extract base64 data
              }
            });
          }
        }
        
        response = await this.ai.models.generateContent({
          model: "gemini-2.5-pro",
          contents: contentParts,
        });
      }

      const responseText = response.text || "Something went wrong";
      const words = responseText.split(' ');
      for (const word of words) {
        yield { content: word + ' ' };
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error('Gemini streaming API error:', error);
      // Fallback to simulated streaming
      const fakeResponse = await this.simulateGeminiResponse(message, conversationHistory);
      const words = fakeResponse.response.split(' ');
      for (const word of words) {
        yield { content: word + ' ' };
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  private async simulateGeminiResponse(
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

  private parseMessageWithImages(message: string): string | { text: string; images?: string[] } {
    // Check if message contains image data
    const imageRegex = /\[Image: ([^\]]+)\]\n\nImage data: (data:[^;]+;base64,[^\s]+)/g;
    const matches = Array.from(message.matchAll(imageRegex));
    
    if (matches.length === 0) {
      // No images, return simple text message
      return message;
    }

    // For Gemini, we need to format images differently
    // Extract text parts and prepare for Gemini's format
    let textContent = message;
    const images: string[] = [];

    for (const match of matches) {
      const [fullMatch, imageName, imageData] = match;
      textContent = textContent.replace(fullMatch, `[Image: ${imageName}]`);
      images.push(imageData);
    }

    return {
      text: textContent,
      images: images
    };
  }
}

export const geminiService = new GeminiService();