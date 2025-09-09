import { enhanceMessageForThinking, getModelParameters } from '../utils/messageEnhancement';

class UserGrokService {
  private getActualModelName(modelId: string): string {
    // Map our model IDs to actual xAI model names
    const modelMap: { [key: string]: string } = {
      'grok-beta': 'grok-beta',
      'grok-2': 'grok-beta' // Use grok-beta as the actual model name
    };
    return modelMap[modelId] || 'grok-beta';
  }

  private async makeRequest(
    userApiKey: string,
    message: string,
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
      // Enhance message based on thinking mode and web search
      const enhancedMessage = enhanceMessageForThinking(message, options);
      const modelParams = getModelParameters(options);

      // Build messages array with conversation history
      const messages = [
        ...conversationHistory,
        { role: "user", content: enhancedMessage }
      ];

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.getActualModelName('grok-beta'),
          messages: messages,
          max_tokens: options.maxTokens || modelParams.maxTokens,
          temperature: options.temperature || modelParams.temperature,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const responseText = data.choices[0]?.message?.content || '';
      const tokens = data.usage?.total_tokens || Math.ceil((message + responseText).length / 4);

      return {
        response: responseText,
        tokens: tokens,
        cost: 0 // User pays directly, so no cost to us
      };
    } catch (error) {
      console.error('User Grok API error:', error);
      throw new Error(`Grok API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendMessage(
    message: string,
    model: string = "grok-beta",
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
    return this.makeRequest(userApiKey, message, conversationHistory, options);
  }

  async *sendMessageStream(
    message: string,
    model: string = "grok-beta",
    conversationHistory: Array<{ role: string; content: string }> = [],
    userApiKey: string,
    options: {
      thinkingMode?: 'fast' | 'deep' | 'research';
      webSearch?: boolean;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): AsyncGenerator<{ content: string }, void, unknown> {
    try {
      // Enhance message based on thinking mode and web search
      const enhancedMessage = enhanceMessageForThinking(message, options);
      const modelParams = getModelParameters(options);

      // Build messages array with conversation history
      const messages = [
        ...conversationHistory,
        { role: "user", content: enhancedMessage }
      ];

      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.getActualModelName('grok-beta'),
          messages: messages,
          max_tokens: options.maxTokens || modelParams.maxTokens,
          temperature: options.temperature || modelParams.temperature,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Grok API error: ${response.status} ${response.statusText}`);
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
              const content = parsed.choices[0]?.delta?.content;
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
      console.error('User Grok streaming error:', error);
      throw new Error(`Grok streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  calculateCost(tokens: number): number {
    // User pays directly, so no cost to us
    return 0;
  }
}

export const userGrokService = new UserGrokService();
