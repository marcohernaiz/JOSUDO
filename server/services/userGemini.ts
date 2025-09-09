import { GoogleGenerativeAI } from '@google/generative-ai';

class UserGeminiService {
  private createClient(apiKey: string): GoogleGenerativeAI {
    return new GoogleGenerativeAI(apiKey);
  }

  private getActualModelName(modelId: string): string {
    // Map our model IDs to actual Google model names
    const modelMap: { [key: string]: string } = {
      'gemini-pro': 'gemini-pro',
      'gemini-2.5-pro': 'gemini-2.0-flash-exp' // Use the latest available model
    };
    return modelMap[modelId] || 'gemini-pro';
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
      const geminiModel = genAI.getGenerativeModel({ 
        model: this.getActualModelName(model),
        generationConfig: {
          maxOutputTokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
        }
      });

      // Build conversation history for Gemini
      const history = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const chat = geminiModel.startChat({
        history: history as any,
      });

      const result = await chat.sendMessage(message);
      const response = await result.response;
      const responseText = response.text();

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
      const geminiModel = genAI.getGenerativeModel({ 
        model: this.getActualModelName(model),
        generationConfig: {
          maxOutputTokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
        }
      });

      // Build conversation history for Gemini
      const history = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      const chat = geminiModel.startChat({
        history: history as any,
      });

      const result = await chat.sendMessageStream(message);
      
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
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
