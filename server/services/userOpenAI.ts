import OpenAI from "openai";

class UserOpenAIService {
  private createClient(apiKey: string): OpenAI {
    return new OpenAI({ apiKey });
  }

  private getActualModelName(modelId: string): string {
    // Map our model IDs to actual OpenAI model names
    const modelMap: { [key: string]: string } = {
      'gpt-4': 'gpt-4',
      'gpt-4o': 'gpt-4o',
      'gpt-5': 'gpt-4o' // Fallback to GPT-4o since GPT-5 isn't available to users yet
    };
    return modelMap[modelId] || 'gpt-4o';
  }

  async sendMessage(
    message: string,
    userId: number,
    sessionId: string,
    userApiKey: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    model: string = "gpt-4o"
  ): Promise<{
    choices: Array<{ message: { content: string }; usage?: { total_tokens: number } }>;
  }> {
    const openai = this.createClient(userApiKey);

    try {
      // Build messages array with conversation history
      const messages: Array<{ role: string; content: string }> = [
        ...conversationHistory,
        { role: "user", content: message }
      ];

      const actualModel = this.getActualModelName(model);
      const completion = await openai.chat.completions.create({
        model: actualModel, // Use the actual model name
        messages: messages as any,
        max_tokens: 4096,
        temperature: 0.7,
      });

      return {
        choices: completion.choices.map(choice => ({
          message: { content: choice.message.content || "" },
          usage: completion.usage ? { total_tokens: completion.usage.total_tokens } : undefined
        }))
      };
    } catch (error) {
      console.error('User OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *sendMessageStream(
    message: string,
    userId: number,
    sessionId: string,
    userApiKey: string,
    conversationHistory: Array<{ role: string; content: string }> = [],
    model: string = "gpt-4o"
  ): AsyncGenerator<{ content: string }, void, unknown> {
    const openai = this.createClient(userApiKey);

    try {
      // Build messages array with conversation history
      const messages: Array<{ role: string; content: string }> = [
        ...conversationHistory,
        { role: "user", content: message }
      ];

      const actualModel = this.getActualModelName(model);
      const stream = await openai.chat.completions.create({
        model: actualModel, // Use the actual model name
        messages: messages as any,
        max_tokens: 4096,
        temperature: 0.7,
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

  calculateCost(tokens: number, model: string = "gpt-4o"): number {
    // User pays directly, so no cost to us
    return 0;
  }
}

export const userOpenAIService = new UserOpenAIService();
