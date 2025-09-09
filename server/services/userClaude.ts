import Anthropic from '@anthropic-ai/sdk';

class UserClaudeService {
  private createClient(apiKey: string): Anthropic {
    return new Anthropic({ apiKey });
  }

  private getActualModelName(modelId: string): string {
    // Map our model IDs to actual Anthropic model names
    const modelMap: { [key: string]: string } = {
      'claude-3-5-sonnet': 'claude-3-5-sonnet-20241022',
      'claude-3-5-sonnet-replicate': 'claude-3-5-sonnet-20241022'
    };
    return modelMap[modelId] || 'claude-3-5-sonnet-20241022';
  }

  async sendMessage(
    message: string,
    model: string = "claude-3-5-sonnet-20241022",
    conversationHistory: Array<{ role: string; content: string }> = [],
    userApiKey: string
  ): Promise<{
    response: string;
    tokens: number;
    cost: number;
  }> {
    const anthropic = this.createClient(userApiKey);

    try {
      // Build messages array with conversation history
      const messages: Array<{ role: string; content: string }> = [
        ...conversationHistory,
        { role: "user", content: message }
      ];

      // Convert to Anthropic format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));

      const actualModel = this.getActualModelName(model);
      const response = await anthropic.messages.create({
        model: actualModel,
        max_tokens: 4096,
        temperature: 0.7,
        messages: anthropicMessages as any,
      });

      const responseText = response.content[0]?.type === 'text' ? response.content[0].text : '';
      const tokens = response.usage.input_tokens + response.usage.output_tokens;

      return {
        response: responseText,
        tokens: tokens,
        cost: 0 // User pays directly, so no cost to us
      };
    } catch (error) {
      console.error('User Claude API error:', error);
      throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *sendMessageStream(
    message: string,
    model: string = "claude-3-5-sonnet-20241022",
    conversationHistory: Array<{ role: string; content: string }> = [],
    userApiKey: string
  ): AsyncGenerator<{ content: string }, void, unknown> {
    const anthropic = this.createClient(userApiKey);

    try {
      // Build messages array with conversation history
      const messages: Array<{ role: string; content: string }> = [
        ...conversationHistory,
        { role: "user", content: message }
      ];

      // Convert to Anthropic format
      const anthropicMessages = messages.map(msg => ({
        role: msg.role as "user" | "assistant",
        content: msg.content
      }));

      const actualModel = this.getActualModelName(model);
      const stream = await anthropic.messages.create({
        model: actualModel,
        max_tokens: 4096,
        temperature: 0.7,
        messages: anthropicMessages as any,
        stream: true,
      });

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          yield { content: chunk.delta.text };
        }
      }
    } catch (error) {
      console.error('User Claude streaming error:', error);
      throw new Error(`Claude streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  calculateCost(tokens: number): number {
    // User pays directly, so no cost to us
    return 0;
  }
}

export const userClaudeService = new UserClaudeService();
