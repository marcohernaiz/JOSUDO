import Anthropic from '@anthropic-ai/sdk';
import { getSecret } from '../admin';

class AnthropicService {
  private getClient(apiKey?: string) {
    const key = apiKey || getSecret('ANTHROPIC_API_KEY') || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }
    return new Anthropic({ apiKey: key });
  }

  private parseMessageWithImages(message: string): { text: string; images: { type: 'image'; source: string }[] } {
    // Check if message contains image data
    const imageRegex = /\[Image: ([^\]]+)\]\n\nImage data: (data:[^;]+;base64,[^\s]+)/g;
    const matches = Array.from(message.matchAll(imageRegex));
    
    console.log(`[Anthropic] Parsing message for images. Found ${matches.length} images.`);
    
    const images: { type: 'image'; source: string }[] = [];
    let text = message;

    for (const match of matches) {
      const [fullMatch, imageName, imageData] = match;
      
      // Add image to the list
      images.push({
        type: 'image',
        source: imageData // Claude accepts base64 directly
      });

      // Replace image data in text with a reference
      text = text.replace(fullMatch, `[Image: ${imageName}]`);
    }

    return { text, images };
  }

  async sendMessage(
    message: string,
    userId: string,
    sessionId: string,
    userApiKey?: string,
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<{
    response: string;
    tokens: number;
    cost: number;
  }> {
    const client = this.getClient(userApiKey);
    const { text, images } = this.parseMessageWithImages(message);

    try {
      console.log(`[Anthropic] Sending message with ${images.length} images`);
      
      const response = await client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text },
              ...images
            ]
          }
        ]
      });

      const tokens = response.usage?.input_tokens || 0;
      return {
        response: response.content[0].text,
        tokens,
        cost: this.calculateCost(tokens)
      };
    } catch (error) {
      console.error('[Anthropic] Error:', error);
      throw error;
    }
  }

  async sendMessageStream(
    message: string,
    userId: string,
    sessionId: string,
    userApiKey?: string,
    options: {
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<ReadableStream> {
    const client = this.getClient(userApiKey);
    const { text, images } = this.parseMessageWithImages(message);

    try {
      console.log(`[Anthropic] Starting stream with ${images.length} images`);
      
      const response = await client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.7,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text },
              ...images
            ]
          }
        ],
        stream: true
      });

      return response.toReadableStream();
    } catch (error) {
      console.error('[Anthropic] Stream Error:', error);
      throw error;
    }
  }

  calculateCost(tokens: number): number {
    // Claude 3 Sonnet pricing: $0.003/1K input tokens, $0.015/1K output tokens
    // Using average cost for simplicity
    return (tokens / 1000) * 0.009;
  }
}

export const anthropicService = new AnthropicService();
