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

  private parseMessageWithImages(message: string): { text: string; images: any[] } {
    // Check if message contains image data
    // Capture full base64 string (including potential newlines)
    const imageRegex = /\[Image: ([^\]]+)\]\n\nImage data: (data:image\/([^;]+);base64,([A-Za-z0-9+/=\n\r]+?)(?=\n\n---|\n\n\[Image:|$))/gs;
    const matches = Array.from(message.matchAll(imageRegex));
    
    console.log(`[Anthropic] Parsing message for images. Found ${matches.length} images.`);
    
    const images: any[] = [];
    let text = message;

    for (const match of matches) {
      const [fullMatch, imageName, imageDataUrl, mediaType, base64DataRaw] = match;
      
      // Clean base64 data (remove any whitespace/newlines)
      const base64Data = base64DataRaw.replace(/[\s\n\r]/g, '');
      
      console.log(`[Anthropic] Image ${imageName}: type=${mediaType}, base64 length=${base64Data.length}`);
      
      // Add image in Claude's expected format
      images.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: `image/${mediaType}`,
          data: base64Data
        }
      });

      // Replace image data in text with a reference
      text = text.replace(fullMatch, `[Image: ${imageName}]`);
    }

    console.log(`[Anthropic] Parsed ${images.length} images with media types`);

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
