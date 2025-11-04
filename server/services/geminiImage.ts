import { userApiKeysService } from './userApiKeys';

/**
 * Service for Gemini 2.5 Flash Image (Nano Banana) - Image Generation
 * Uses direct API calls to Google's Generative Language API
 */
class GeminiImageService {
  /**
   * Generate an image using Gemini 2.5 Flash Image (Nano Banana)
   * @param prompt - Text prompt describing the image to generate
   * @param apiKey - User's Gemini API key
   * @param options - Generation options
   */
  async generateImage(
    prompt: string,
    apiKey: string,
    options: {
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
      safetySetting?: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
      personGeneration?: 'ALLOW_ALL' | 'ALLOW_ADULT' | 'ALLOW_NONE';
    } = {}
  ): Promise<{
    imageBase64: string;
    mimeType: string;
  }> {
    try {
      // Use the Gemini 2.5 Flash Image model (Nano Banana)
      // The model name is typically "gemini-2.5-flash-image-exp" or similar
      const modelName = 'gemini-2.5-flash-image-exp';
      
      const requestBody: any = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192,
        }
      };

      // Add optional parameters
      if (options.aspectRatio) {
        requestBody.generationConfig.aspectRatio = options.aspectRatio;
      }

      if (options.safetySetting) {
        requestBody.safetySettings = [
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: options.safetySetting
          },
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: options.safetySetting
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: options.safetySetting
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: options.safetySetting
          }
        ];
      }

      if (options.personGeneration) {
        requestBody.generationConfig.personGeneration = options.personGeneration;
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[GeminiImage] API error: ${response.status} ${response.statusText}`, errorText);
        throw new Error(`Gemini Image API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      // Extract image from response
      // The response structure may vary, so we check multiple possible locations
      let imageBase64: string | undefined;
      let mimeType: string = 'image/png';

      if (data.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        imageBase64 = data.candidates[0].content.parts[0].inlineData.data;
        mimeType = data.candidates[0].content.parts[0].inlineData.mimeType || 'image/png';
      } else if (data.response?.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
        imageBase64 = data.response.candidates[0].content.parts[0].inlineData.data;
        mimeType = data.response.candidates[0].content.parts[0].inlineData.mimeType || 'image/png';
      } else if (data.images?.[0]?.data) {
        imageBase64 = data.images[0].data;
        mimeType = data.images[0].mimeType || 'image/png';
      }

      if (!imageBase64) {
        console.error('[GeminiImage] No image data found in response:', JSON.stringify(data, null, 2));
        throw new Error('No image data returned from Gemini Image API');
      }

      return {
        imageBase64,
        mimeType,
      };
    } catch (error) {
      console.error('[GeminiImage] Error generating image:', error);
      throw error;
    }
  }

  /**
   * Generate image for a user (gets API key from user's stored keys)
   */
  async generateImageForUser(
    userId: number,
    prompt: string,
    options?: {
      aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3' | '3:4';
      safetySetting?: 'BLOCK_NONE' | 'BLOCK_ONLY_HIGH' | 'BLOCK_MEDIUM_AND_ABOVE' | 'BLOCK_LOW_AND_ABOVE';
      personGeneration?: 'ALLOW_ALL' | 'ALLOW_ADULT' | 'ALLOW_NONE';
    }
  ): Promise<{
    imageBase64: string;
    mimeType: string;
  }> {
    // Get user's Gemini API key (normalize gemini -> google)
    const apiKey = await userApiKeysService.getApiKey(userId, 'google');
    
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please add your API key in Settings > Integrations.');
    }

    return this.generateImage(prompt, apiKey, options);
  }
}

export const geminiImageService = new GeminiImageService();

