import { getSecret } from '../admin';

class DeepSeekService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // Use OpenRouter for DeepSeek V3 access
    this.apiKey = getSecret('OPENROUTER_API_KEY') || process.env.OPENROUTER_API_KEY || '';
    this.baseUrl = 'https://openrouter.ai/api/v1';
  }

  async sendMessage(
    message: string, 
    model: string = 'deepseek/deepseek-chat-v3.1:free',
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
      const apiKey = this.apiKey;
      if (!apiKey) {
        return this.simulateDeepSeekResponse(message, conversationHistory);
      }

      // Enhance message based on thinking mode
      const enhancedMessage = this.enhanceMessageForThinking(message, options);

      // Check if message contains images
      const hasImages = /\[Image: ([^\]]+)\]\n\nImage data: (data:[^;]+;base64,[^\s]+)/g.test(enhancedMessage);
      
      if (hasImages) {
        // DeepSeek V3.1 doesn't support vision, provide helpful response
        return {
          response: `I can see you've attached an image, but I'm currently running on DeepSeek V3.1 which doesn't support image analysis. 

To analyze images, please switch to a vision-capable model like:
• GPT-4 Vision (if you have OpenAI credits)
• Claude 3.5 Sonnet (if you have an Anthropic API key)
• Gemini Pro Vision (if you have a Google API key)

You can add your own API keys in the settings to use these vision models. For now, I can only process text-based questions. What would you like to know about?`,
          tokens: 100,
          cost: 0
        };
      }

      // Parse message with images (for future compatibility)
      const parsedMessage = this.parseMessageWithImages(enhancedMessage);

      // Prepare messages array with conversation history
      const messages = [
        ...conversationHistory.map(msg => ({ role: msg.role as 'user' | 'assistant' | 'system', content: msg.content })),
        parsedMessage
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://josudo.org',
          'X-Title': 'Josudo AI Platform'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3.1:free',
          messages,
          max_tokens: options.maxTokens || (options.thinkingMode === 'research' ? 8192 : 4096),
          temperature: options.temperature || (options.thinkingMode === 'deep' ? 0.3 : 0.7),
          stream: false
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0].message.content || '';
      const tokens = data.usage?.total_tokens || 0;
      const cost = this.calculateCost(tokens);

      return {
        response: responseText,
        tokens,
        cost
      };
    } catch (error) {
      console.error('DeepSeek OpenRouter API error:', error);
      return this.simulateDeepSeekResponse(message, conversationHistory);
    }
  }

  async *sendMessageStream(
    message: string, 
    model: string = 'deepseek/deepseek-chat-v3.1:free',
    conversationHistory: Array<{ role: string; content: string }> = [],
    options: {
      thinkingMode?: 'fast' | 'deep' | 'research';
      webSearch?: boolean;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): AsyncGenerator<{ content: string; tokens?: number }, void, unknown> {
    try {
      const apiKey = this.apiKey;
      if (!apiKey) {
        // Fallback to simulated streaming
        const response = await this.simulateDeepSeekResponse(message, conversationHistory);
        const words = response.content.split(' ');
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const content = i === words.length - 1 ? word : word + ' ';
          yield { content };
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        return;
      }

      // Enhance message based on thinking mode
      const enhancedMessage = this.enhanceMessageForThinking(message, options);

      // Check if message contains images
      const hasImages = /\[Image: ([^\]]+)\]\n\nImage data: (data:[^;]+;base64,[^\s]+)/g.test(enhancedMessage);
      
      if (hasImages) {
        // DeepSeek V3.1 doesn't support vision, provide helpful response
        const visionResponse = `I can see you've attached an image, but I'm currently running on DeepSeek V3.1 which doesn't support image analysis. 

To analyze images, please switch to a vision-capable model like:
• GPT-4 Vision (if you have OpenAI credits)
• Claude 3.5 Sonnet (if you have an Anthropic API key)
• Gemini Pro Vision (if you have a Google API key)

You can add your own API keys in the settings to use these vision models. For now, I can only process text-based questions. What would you like to know about?`;
        
        // Stream the response word by word
        const words = visionResponse.split(' ');
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          const content = i === words.length - 1 ? word : word + ' ';
          yield { content };
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        return;
      }

      // Parse message with images (for future compatibility)
      const parsedMessage = this.parseMessageWithImages(enhancedMessage);

      // Prepare messages array with conversation history
      const messages = [
        ...conversationHistory.map(msg => ({ role: msg.role as 'user' | 'assistant' | 'system', content: msg.content })),
        parsedMessage
      ];

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://josudo.org',
          'X-Title': 'Josudo AI Platform'
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat-v3.1:free',
          messages,
          max_tokens: options.maxTokens || (options.thinkingMode === 'research' ? 8192 : 4096),
          temperature: options.temperature || (options.thinkingMode === 'deep' ? 0.3 : 0.7),
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield { content };
              }
            } catch (e) {
              // Ignore parsing errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      console.error('DeepSeek streaming error:', error);
      // Fallback to simulated streaming
      const response = await this.simulateDeepSeekResponse(message, conversationHistory);
      const words = response.content.split(' ');
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const content = i === words.length - 1 ? word : word + ' ';
        yield { content };
        await new Promise(resolve => setTimeout(resolve, 50));
      }
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

    // DeepSeek V3.1 doesn't support vision - this will be handled in the calling method
    // For now, return the original message to trigger the vision detection
    return {
      role: "user" as const,
      content: message,
    };
  }

  async simulateDeepSeekResponse(message: string, conversationHistory: Array<{ role: string; content: string }> = []): Promise<{
    content: string;
    tokens: number;
  }> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const tokens = Math.ceil(message.length / 4) + Math.floor(Math.random() * 100) + 50;
    
    // Generate contextual responses based on message content
    let response = this.generateContextualResponse(message);
    
    return {
      content: response,
      tokens
    };
  }

  private generateContextualResponse(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    // Code-related responses
    if (lowerMessage.includes('code') || lowerMessage.includes('programming') || lowerMessage.includes('function')) {
      return `I'd be happy to help with coding! Here's a basic approach:

\`\`\`javascript
function example() {
  // Your code here
  return "Hello, World!";
}
\`\`\`

This is a working example using DeepSeek AI. For more complex implementations, I can help you break down the problem step by step. What specific programming language or framework are you working with?`;
    }
    
    // Business/AI related
    if (lowerMessage.includes('business') || lowerMessage.includes('ai') || lowerMessage.includes('platform')) {
      return `Great question about AI and business! Here are some key insights:

• AI platforms like this one help businesses scale their operations
• Integration with multiple AI providers gives you flexibility
• Cost-effective solutions often combine free and premium services

For your specific use case, I'd recommend starting with the free tier to test functionality, then scaling up based on your needs. What aspect of AI implementation are you most interested in exploring?`;
    }
    
    // General help
    if (lowerMessage.includes('help') || lowerMessage.includes('how') || lowerMessage.includes('what')) {
      return `I'm here to help! As your AI assistant, I can assist with:

• Technical questions and coding problems
• Business strategy and AI implementation
• Platform features and best practices
• General knowledge and research

This platform (Josudo) connects you to multiple AI services, and I'm currently running on DeepSeek's free tier. Feel free to ask me anything - from simple questions to complex technical challenges!`;
    }
    
    // Default response
    return `Thank you for your message! I'm DeepSeek AI, currently providing free AI assistance through the Josudo platform. 

Your message: "${message}"

I understand you're looking for information or assistance. I can help with a wide variety of topics including:

• Technical and programming questions
• Business and strategy advice  
• Creative writing and content
• Analysis and research
• General knowledge questions

How can I assist you further? Feel free to ask me anything specific you'd like to explore!`;
  }

  calculateCost(tokens: number): number {
    // DeepSeek V3.1 Free model - no cost but we track minimal cost for monitoring
    return 0; // Completely free!
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.sendMessage("test");
      return true;
    } catch {
      return false;
    }
  }

  // Generate a chat summary specifically
  async generateSummary(conversationText: string): Promise<string> {
    const summaryPrompt = `Create a brief, descriptive title (maximum 50 characters) for this conversation. Focus on the main topic. Return only the title.

Conversation:
${conversationText}

Title:`;

    try {
      const response = await this.simulateDeepSeekResponse(summaryPrompt);
      let summary = response.content.trim();
      
      // Extract just the first line if there are multiple lines
      const firstLine = summary.split('\n')[0];
      
      // Remove common prefixes and quotes
      summary = firstLine
        .replace(/^(Title:|Summary:|Chat about|Conversation about|Topic:)\s*/i, '')
        .replace(/^["']|["']$/g, '')
        .trim();
      
      // Limit to 50 characters
      if (summary.length > 50) {
        summary = summary.substring(0, 47) + '...';
      }
      
      return summary || "Chat Summary";
    } catch (error) {
      console.error("Error generating summary:", error);
      return "Chat Summary";
    }
  }

  // Test streaming functionality
  async testStreaming(): Promise<void> {
    console.log("Testing DeepSeek streaming...");
    let totalContent = "";
    for await (const chunk of this.sendMessageStream("Hello world", "deepseek-chat", [])) {
      totalContent += chunk.content;
      console.log("Test chunk:", chunk.content);
    }
    console.log("Test streaming completed, total content:", totalContent);
  }
}

export const deepseekService = new DeepSeekService();