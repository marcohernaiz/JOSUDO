import { GoogleGenAI } from '@google/genai';

class UserGeminiService {
  private createClient(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey });
  }

  private getActualModelName(modelId: string): string {
    // Map our model IDs to actual Google model names
    const modelMap: { [key: string]: string } = {
      'gemini-pro': 'gemini-2.5-pro', // Use the latest available model
      'gemini-2.5-pro': 'gemini-2.5-pro'
    };
    return modelMap[modelId] || 'gemini-2.5-pro';
  }

  async sendMessage(
    message: string,
    model: string = "gemini-pro",
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
    const genAI = this.createClient(userApiKey);

    try {
      const actualModel = this.getActualModelName(model);
      
      // Prepare conversation history
      const historyContent = conversationHistory.length > 0 
        ? conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n') + '\n\n'
        : '';

      const fullContent = historyContent + message;

      const response = await genAI.models.generateContent({
        model: actualModel,
        contents: fullContent,
      });

      const responseText = response.response.text();

      // Estimate tokens (rough calculation)
      const inputTokens = Math.ceil((message + conversationHistory.map(m => m.content).join('')).length / 4);
      const outputTokens = Math.ceil(responseText.length / 4);
      const totalTokens = inputTokens + outputTokens;

      return {
        response: responseText,
        tokens: totalTokens,
        cost: 0 // User pays directly, so no cost to us
      };
    } catch (error) {
      console.error('User Gemini API error:', error);
      throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *sendMessageStream(
    message: string,
    model: string = "gemini-pro",
    conversationHistory: Array<{ role: string; content: string }> = [],
    userApiKey: string,
    options: {
      thinkingMode?: 'fast' | 'deep' | 'research';
      webSearch?: boolean;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): AsyncGenerator<{ content: string }, void, unknown> {
    const genAI = this.createClient(userApiKey);

    try {
      const actualModel = this.getActualModelName(model);
      
      // Prepare conversation history
      const historyContent = conversationHistory.length > 0 
        ? conversationHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n') + '\n\n'
        : '';

      const fullContent = historyContent + message;

      const response = await genAI.models.generateContentStream({
        model: actualModel,
        contents: fullContent,
      });

      for await (const chunk of response) {
        const chunkText = chunk.response.text();
        if (chunkText) {
          yield { content: chunkText };
        }
      }
    } catch (error) {
      console.error('User Gemini streaming error:', error);
      throw new Error(`Gemini streaming error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  calculateCost(tokens: number): number {
    // User pays directly, so no cost to us
    return 0;
  }
}

export const userGeminiService = new UserGeminiService();