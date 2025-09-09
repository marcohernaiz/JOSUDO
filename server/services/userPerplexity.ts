class UserPerplexityService {
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
      // Build messages array with conversation history
      const messages = [
        ...conversationHistory,
        { role: "user", content: message }
      ];

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: messages,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
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
      console.error('User Perplexity API error:', error);
      throw new Error(`Perplexity API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendMessage(
    message: string,
    model: string = "sonar-pro",
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
    model: string = "sonar-pro",
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
      // Build messages array with conversation history
      const messages = [
        ...conversationHistory,
        { role: "user", content: message }
      ];

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-pro',
          messages: messages,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
          stream: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText}`);
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
      console.error('User Perplexity streaming error:', error);
      throw new Error(`Perplexity streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  calculateCost(tokens: number): number {
    // User pays directly, so no cost to us
    return 0;
  }
}

export const userPerplexityService = new UserPerplexityService();
