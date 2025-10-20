import OpenAI from "openai";
import { enhanceMessageForThinking, getModelParameters } from '../utils/messageEnhancement';

class UserOpenAIService {
  private createClient(apiKey: string): OpenAI {
    return new OpenAI({ apiKey });
  }

  private getActualModelName(modelId: string): string {
    // Map our model IDs to actual OpenAI model names
    const modelMap: { [key: string]: string } = {
      'gpt-4.1': 'gpt-4.1',
      'gpt-4': 'gpt-4',
      'gpt-4o': 'gpt-4o',
      'gpt-5': 'gpt-4o' // Fallback to GPT-4o since GPT-5 isn't available to users yet
    };
    return modelMap[modelId] || 'gpt-4o';
  }

  async sendMessage(
    message: string,
    model: string = "gpt-4o",
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
      const completion = await openai.chat.completions.create({
        model: actualModel,
        messages: messages as any,
        max_tokens: options.maxTokens || modelParams.maxTokens,
        temperature: options.temperature || modelParams.temperature,
      });

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
    model: string = "gpt-4o",
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
      const stream = await openai.chat.completions.create({
        model: actualModel,
        messages: messages as any,
        max_tokens: options.maxTokens || modelParams.maxTokens,
        temperature: options.temperature || modelParams.temperature,
        stream: true,
      });

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
    const imageRegex = /\[Image: ([^\]]+)\]\n\nImage data: (data:[^;]+;base64,[^\s]+)/g;
    const matches = Array.from(message.matchAll(imageRegex));
    
    if (matches.length === 0) {
      // No images, return simple text message
      return {
        role: "user" as const,
        content: message,
      };
    }

    // Parse message with images
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

    return {
      role: "user" as const,
      content: content,
    };
  }

  calculateCost(tokens: number, model: string = "gpt-4o"): number {
    // User pays directly, so no cost to us
    return 0;
  }
}

export const userOpenAIService = new UserOpenAIService();
