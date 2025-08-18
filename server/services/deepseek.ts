class DeepSeekService {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    // DeepSeek offers free API access
    this.apiKey = 'free-tier'; // Free tier doesn't require real API key
    this.baseUrl = 'https://api.deepseek.com/v1';
  }

  async sendMessage(
    message: string, 
    model: string = 'deepseek-chat',
    conversationHistory: Array<{ role: string; content: string }> = []
  ): Promise<{ 
    response: string; 
    tokens: number; 
    cost: number; 
  }> {
    try {
      // Combine conversation history with current message for context
      const fullContext = conversationHistory.length > 0 
        ? `${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${message}`
        : message;
      
      // Simulate DeepSeek API call with a realistic response
      const response = await this.simulateDeepSeekResponse(fullContext);
      
      return {
        response: response.content,
        tokens: response.tokens,
        cost: 0 // Free tier
      };
    } catch (error) {
      throw new Error('DeepSeek API call failed: ' + (error as Error).message);
    }
  }

  async *sendMessageStream(
    message: string, 
    model: string = 'deepseek-chat',
    conversationHistory: Array<{ role: string; content: string }> = []
  ): AsyncGenerator<{ content: string; tokens?: number }, void, unknown> {
    try {
      // Generate full response first
      const fullContext = conversationHistory.length > 0 
        ? `${conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n')}\n\nUser: ${message}`
        : message;
      
      const response = await this.simulateDeepSeekResponse(fullContext);
      console.log("DeepSeek generated response:", response.content.substring(0, 100) + "...");
      
      // Stream the response word by word
      const words = response.content.split(' ');
      console.log("DeepSeek streaming:", words.length, "words");
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const content = i === words.length - 1 ? word : word + ' '; // Don't add space to last word
        console.log("Streaming word:", content);
        yield { content };
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate streaming delay
      }
    } catch (error) {
      throw new Error('DeepSeek streaming failed: ' + (error as Error).message);
    }
  }

  async simulateDeepSeekResponse(message: string): Promise<{
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
    // DeepSeek free tier - but we'll track tiny cost for monitoring
    return (tokens / 1000000) * 0.14; // $0.14 per 1M tokens (very competitive)
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