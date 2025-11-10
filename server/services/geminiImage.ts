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
      const possibleModelNames = [
        'gemini-2.0-flash-exp',      // Nano Banana
        'gemini-2.0-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-pro-latest',
      ];

      const personGenerationMap: Record<string, string> = {
        ALLOW_ALL: 'ALLOW_ALL',
        ALLOW_ADULT: 'ALLOW_ADULT',
        ALLOW_NONE: 'DONT_ALLOW',
        DONT_ALLOW: 'DONT_ALLOW',
      };

      const defaultSafetyLevel = options.safetySetting || 'BLOCK_NONE';
      const defaultPersonGeneration = options.personGeneration || 'ALLOW_NONE';

      let lastError: Error | null = null;
      let lastResponse: globalThis.Response | null = null;
      let lastResponseBody: any = null;

      const buildPredictBody = () => {
        const parameters: Record<string, any> = {
          outputMimeType: 'image/png',
          numberOfImages: 1,
          safetyFilterLevel: defaultSafetyLevel,
        };

        if (options.aspectRatio) {
          parameters.aspectRatio = options.aspectRatio;
        }

        if (defaultPersonGeneration) {
          const mapped = personGenerationMap[defaultPersonGeneration] || defaultPersonGeneration;
          parameters.personGeneration = mapped;
        }

        return {
          instances: [
            {
              prompt,
            },
          ],
          parameters,
        };
      };

      const buildGenerateContentBody = () => {
        const safetyThreshold = options.safetySetting || 'BLOCK_NONE';

        return {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Generate an image with this description: ${prompt}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            topK: 32,
            topP: 1,
            maxOutputTokens: 8192,
            responseMimeType: 'image/png',
            responseModalities: ['IMAGE'],
            mediaResolution: 'MEDIA_RESOLUTION_HIGH',
          },
          safetySettings: [
            'HARM_CATEGORY_HATE_SPEECH',
            'HARM_CATEGORY_HARASSMENT',
            'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            'HARM_CATEGORY_DANGEROUS_CONTENT',
            'HARM_CATEGORY_CIVIC_INTEGRITY',
          ].map((category) => ({
            category,
            threshold: safetyThreshold,
          })),
        };
      };

      const extractImageFromPredict = (data: any) => {
        const prediction = data?.predictions?.[0];
        if (!prediction) {
          return null;
        }

        if (prediction.bytesBase64Encoded) {
          return {
            imageBase64: prediction.bytesBase64Encoded,
            mimeType: prediction.mimeType || 'image/png',
          };
        }

        if (prediction.image?.bytesBase64Encoded) {
          return {
            imageBase64: prediction.image.bytesBase64Encoded,
            mimeType: prediction.image.mimeType || prediction.mimeType || 'image/png',
          };
        }

        if (prediction.image?.imageBytes) {
          return {
            imageBase64: prediction.image.imageBytes,
            mimeType: prediction.image.mimeType || 'image/png',
          };
        }

        return null;
      };

      const extractImageFromGenerateContent = (data: any) => {
        if (data.candidates?.[0]?.content?.parts) {
          for (const part of data.candidates[0].content.parts) {
            if (part.inlineData?.data) {
              return {
                imageBase64: part.inlineData.data,
                mimeType: part.inlineData.mimeType || 'image/png',
              };
            }

            if (part.text) {
              const urlMatch = part.text.match(/https?:\/\/[^\s)]+/);
              if (urlMatch) {
                return {
                  imageUrl: urlMatch[0],
                  mimeType: 'url',
                };
              }
            }
          }
        }

        if (data.images?.[0]?.data) {
          return {
            imageBase64: data.images[0].data,
            mimeType: data.images[0].mimeType || 'image/png',
          };
        }

        return null;
      };

      for (const modelName of possibleModelNames) {
        const endpointOrder = modelName.startsWith('gemini-2.0')
          ? ['predict', 'generateContent']
          : ['generateContent'];

        for (const endpointType of endpointOrder) {
          const apiVersion =
            endpointType === 'predict'
              ? 'v1beta'
              : modelName.startsWith('gemini-2.0')
                ? 'v1beta'
                : 'v1';

          const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:${endpointType}?key=${encodeURIComponent(apiKey)}`;
          const requestBody = endpointType === 'predict'
            ? buildPredictBody()
            : buildGenerateContentBody();

          try {
            console.log(`[GeminiImage] Trying model: ${modelName} via ${endpointType}`);

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(requestBody),
            });

            lastResponse = response;
            const responseJson = await response.json().catch(() => null);
            lastResponseBody = responseJson;

            if (!response.ok) {
              const errorMessage =
                responseJson?.error?.message ||
                `${response.status} ${response.statusText}`;

              console.log(`[GeminiImage] Model ${modelName} via ${endpointType} failed: ${errorMessage}`);
              lastError = new Error(errorMessage);

              // Try next endpoint/model
              continue;
            }

            console.log('[GeminiImage] =============================================');
            console.log('[GeminiImage] Model used:', modelName);
            console.log('[GeminiImage] Endpoint:', endpointType);
            console.log('[GeminiImage] Response status:', response.status);
            console.log('[GeminiImage] Full API response:');
            console.log(JSON.stringify(responseJson, null, 2));
            console.log('[GeminiImage] =============================================');

            let extractionResult: { imageBase64?: string; mimeType: string; imageUrl?: string } | null = null;

            if (endpointType === 'predict') {
              extractionResult = extractImageFromPredict(responseJson);
            }

            if (!extractionResult) {
              extractionResult = extractImageFromGenerateContent(responseJson);
            }

            if (extractionResult?.imageBase64 || extractionResult?.imageUrl) {
              if (extractionResult.imageUrl && !extractionResult.imageBase64) {
                try {
                  console.log('[GeminiImage] Fetching image from URL and converting to base64...');
                  console.log('[GeminiImage] Image URL:', extractionResult.imageUrl);

                  let imageResponse = await fetch(extractionResult.imageUrl, {
                    headers: {
                      'User-Agent': 'Mozilla/5.0',
                    },
                  });

                  if (!imageResponse.ok) {
                    const urlWithKey = `${extractionResult.imageUrl}${extractionResult.imageUrl.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`;
                    imageResponse = await fetch(urlWithKey, {
                      headers: {
                        'User-Agent': 'Mozilla/5.0',
                      },
                    });
                  }

                  if (imageResponse.ok) {
                    const arrayBuffer = await imageResponse.arrayBuffer();
                    const imageBase64 = Buffer.from(arrayBuffer).toString('base64');
                    const mimeType = imageResponse.headers.get('content-type') || 'image/png';

                    return {
                      imageBase64,
                      mimeType,
                    };
                  }

                  console.error('[GeminiImage] Failed to fetch image, status:', imageResponse.status);
                  throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
                } catch (fetchError: any) {
                  console.error('[GeminiImage] Failed to fetch image from URL:', fetchError);
                  throw new Error(`Failed to fetch image from URL: ${fetchError.message}`);
                }
              }

              return {
                imageBase64: extractionResult.imageBase64 || extractionResult.imageUrl || '',
                mimeType: extractionResult.mimeType,
              };
            }

            console.log('[GeminiImage] No image payload detected, trying next endpoint/model...');
          } catch (error) {
            console.log(`[GeminiImage] Error calling ${modelName} via ${endpointType}:`, error);
            lastError = error as Error;
            continue;
          }
        }
      }

      if (lastResponseBody) {
        console.error('[GeminiImage] Last response body:', JSON.stringify(lastResponseBody, null, 2));
      }

      if (lastResponse && lastResponse.status === 429) {
        throw new Error("Gemini API quota exceeded. Please wait a moment and try again, or check your billing plan.");
      }

      if (lastResponse && lastResponse.status === 404) {
        throw new Error("Image generation model not available. Please try again later.");
      }

      if (lastError) {
        throw lastError;
      }

      throw new Error('No image data returned from Gemini Image API');
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

