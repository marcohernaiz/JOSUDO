import OpenAI from "openai";
import { enhanceMessageForThinking, getModelParameters } from '../utils/messageEnhancement';

class UserOpenAIService {
  private usesCompletionTokenParam(model: string): boolean {
    const lower = model.toLowerCase();
    return lower.startsWith('gpt-5') || lower.startsWith('gpt-4.1');
  }

  private buildTokenParams(model: string, maxTokens: number) {
    const key = this.usesCompletionTokenParam(model)
      ? 'max_completion_tokens'
      : 'max_tokens';
    return { [key]: maxTokens };
  }

  private createClient(apiKey: string): OpenAI {
    return new OpenAI({ apiKey });
  }

  private getActualModelName(modelId: string): string {
    // Map our model IDs to actual OpenAI model names
    const modelMap: { [key: string]: string } = {
      'gpt-5.1': 'gpt-5.1',
      'gpt-5': 'gpt-5.1',
      'gpt-4.1': 'gpt-4.1',
      'gpt-4': 'gpt-4',
      'gpt-4o': 'gpt-4o',
    };
    return modelMap[modelId] || 'gpt-5.1';
  }

  async sendMessage(
    message: string,
    model: string = "gpt-5.1",
    conversationHistory: Array<{ role: string; content: string }> = [],
    userApiKey: string,
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
    const openai = this.createClient(userApiKey);

    try {
      // Enhance message based on thinking mode and web search
      const enhancedMessage = enhanceMessageForThinking(message, options);
      const modelParams = getModelParameters(options);

      // Parse message with images
      const parsedMessage = this.parseMessageWithImages(enhancedMessage);

      // Build messages array with conversation history
      const messages: Array<{ role: string; content: any }> = [
        ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
        parsedMessage
      ];

      const actualModel = this.getActualModelName(model);
      const tokenParams = this.buildTokenParams(actualModel, options.maxTokens || modelParams.maxTokens);
      const completion = await openai.chat.completions.create({
        model: actualModel,
        messages: messages as any,
        temperature: options.temperature || modelParams.temperature,
        ...tokenParams,
      } as OpenAI.Chat.ChatCompletionCreateParams);

      const responseText = completion.choices[0]?.message?.content || '';
      const tokens = completion.usage?.total_tokens || Math.ceil((enhancedMessage.length + responseText.length) / 4);

      return {
        response: responseText,
        tokens: tokens,
        cost: 0 // User pays directly, no cost to us
      };
    } catch (error) {
      console.error('User OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *sendMessageStream(
    message: string,
    model: string = "gpt-5.1",
    conversationHistory: Array<{ role: string; content: string }> = [],
    userApiKey: string,
    options: {
      thinkingMode?: 'fast' | 'deep' | 'research';
      webSearch?: boolean;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): AsyncGenerator<{ content: string }, void, unknown> {
    const openai = this.createClient(userApiKey);

    try {
      // Enhance message based on thinking mode and web search
      const enhancedMessage = enhanceMessageForThinking(message, options);
      const modelParams = getModelParameters(options);

      // Parse message with images
      const parsedMessage = this.parseMessageWithImages(enhancedMessage);

      // Build messages array with conversation history
      const messages: Array<{ role: string; content: any }> = [
        ...conversationHistory.map(msg => ({ role: msg.role, content: msg.content })),
        parsedMessage
      ];

      const actualModel = this.getActualModelName(model);
      const tokenParams = this.buildTokenParams(actualModel, options.maxTokens || modelParams.maxTokens);
      const stream = await openai.chat.completions.create({
        model: actualModel,
        messages: messages as any,
        temperature: options.temperature || modelParams.temperature,
        stream: true,
        ...tokenParams,
      } as OpenAI.Chat.ChatCompletionCreateParamsStreaming);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          yield { content };
        }
      }
    } catch (error) {
      console.error('User OpenAI streaming error:', error);
      throw new Error(`OpenAI streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseMessageWithImages(message: string): { role: "user"; content: any } {
    // Check if message contains image data
    // Capture full base64 string (including potential newlines)
    const imageRegex = /\[Image: ([^\]]+)\]\n\nImage data: (data:image\/[^;]+;base64,([A-Za-z0-9+/=\n\r]+?)(?=\n\n---|\n\n\[Image:|$))/gs;
    const matches = Array.from(message.matchAll(imageRegex));
    
    console.log(`[UserOpenAI] Parsing message for images. Found ${matches.length} images.`);
    console.log(`[UserOpenAI] Message length: ${message.length} characters`);
    console.log(`[UserOpenAI] Message contains [Image:]: ${message.includes('[Image:')}`);
    console.log(`[UserOpenAI] Message contains Image data:: ${message.includes('Image data:')}`);
    console.log(`[UserOpenAI] First 500 chars: ${message.substring(0, 500)}`);
    
    if (matches.length === 0) {
      // No images, return simple text message
      return {
        role: "user" as const,
        content: message,
      };
    }

    console.log(`[UserOpenAI] Processing ${matches.length} images for vision-capable model`);

    // Parse message with images
    const content: any[] = [];
    let lastIndex = 0;

    for (const match of matches) {
      const [fullMatch, imageName, imageDataFull, base64DataRaw] = match;
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

      // Clean base64 data (remove any whitespace/newlines)
      const cleanedImageData = imageDataFull.replace(/[\s\n\r]/g, '');
      
      // Add image
      content.push({
        type: "image_url",
        image_url: {
          url: cleanedImageData.startsWith('data:') ? cleanedImageData : `data:image/jpeg;base64,${cleanedImageData}`,
          detail: "high"
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

    console.log(`[UserOpenAI] Final content structure:`, JSON.stringify(content.map(item => {
      if (item.type === 'image_url') {
        return {
          type: 'image_url',
          image_url: {
            url: item.image_url.url.substring(0, 50) + '...',
            detail: item.image_url.detail
          }
        };
      }
      return item;
    }), null, 2));
    
    // Log the actual model being used
    console.log(`[UserOpenAI] Using model: ${this.getActualModelName(model)} for vision request`);

    return {
      role: "user" as const,
      content: content,
    };
  }

  calculateCost(tokens: number, model: string = "gpt-5.1"): number {
    // User pays directly, so no cost to us
    return 0;
  }
}

export const userOpenAIService = new UserOpenAIService();
