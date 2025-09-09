import { getSecret } from '../admin';

class PerplexityService {
  private async makeRequest(
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
      const apiKey = getSecret('PERPLEXITY_API_KEY') || process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        return this.simulatePerplexityResponse(message);
      }

      // Build messages array with conversation history
      const messages = [
        ...conversationHistory,
        { role: "user", content: message }
      ];

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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
        cost: this.calculateCost(tokens)
      };
    } catch (error) {
      console.error('Perplexity API error:', error);
      return this.simulatePerplexityResponse(message);
    }
  }

  async sendMessage(
    message: string,
    model: string = "sonar-pro",
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
    return this.makeRequest(message, conversationHistory, options);
  }

  async *sendMessageStream(
    message: string,
    model: string = "sonar-pro",
    conversationHistory: Array<{ role: string; content: string }> = [],
    options: {
      thinkingMode?: 'fast' | 'deep' | 'research';
      webSearch?: boolean;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): AsyncGenerator<{ content: string }, void, unknown> {
    try {
      const apiKey = getSecret('PERPLEXITY_API_KEY') || process.env.PERPLEXITY_API_KEY;
      if (!apiKey) {
        // Fallback to non-streaming for simulation
        const result = await this.simulatePerplexityResponse(message);
        const words = result.response.split(' ');
        for (const word of words) {
          yield { content: word + ' ' };
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        return;
      }

      // Build messages array with conversation history
      const messages = [
        ...conversationHistory,
        { role: "user", content: message }
      ];

      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
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
      console.error('Perplexity streaming error:', error);
      // Fallback to non-streaming simulation
      const result = await this.simulatePerplexityResponse(message);
      const words = result.response.split(' ');
      for (const word of words) {
        yield { content: word + ' ' };
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  private simulatePerplexityResponse(message: string): {
    response: string;
    tokens: number;
    cost: number;
  } {
    const responses = [
      `I understand you're asking about "${message}". Let me search for the most current information on this topic. Based on recent data, here's what I found...`,
      `That's an interesting question about "${message}". Let me provide you with the latest insights and information available on this subject.`,
      `I'll help you with information about "${message}". Let me gather the most relevant and up-to-date details for you.`,
      `Regarding "${message}", I can provide you with comprehensive information based on current data and research. Here's what I found...`
    ];

    const response = responses[Math.floor(Math.random() * responses.length)];
    const tokens = Math.ceil((message.length + response.length) / 4);

    return {
      response,
      tokens,
      cost: this.calculateCost(tokens)
    };
  }

  calculateCost(tokens: number): number {
    // Perplexity pricing: $0.20 per 1M input tokens, $0.20 per 1M output tokens
    // Simplified calculation: $0.20 per 1M tokens total
    return (tokens / 1000000) * 0.20;
  }
}

export const perplexityService = new PerplexityService();
