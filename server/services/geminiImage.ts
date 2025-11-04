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
      // Use the Gemini Flash models that support image generation
      // Try multiple possible model names (updated list based on availability)
      const possibleModelNames = [
        'gemini-2.0-flash-exp',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro-vision'
      ];
      
      let modelName = possibleModelNames[0];
      let lastError: Error | null = null;
      
      // Try each model name until one works
      for (const name of possibleModelNames) {
        try {
          modelName = name;
          console.log(`[GeminiImage] Trying model: ${name}`);
          // We'll use this in the request below
          break; // For now, use first one, but we can implement retry logic if needed
        } catch (error) {
          lastError = error as Error;
          continue;
        }
      }
      
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

      // Add safety settings if provided
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
      
      // Note: aspectRatio and personGeneration are NOT supported in the API
      // They were causing 400 errors

      // Try the primary model first
      let response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        }
      );
      
      // If the first model fails, try alternative endpoints
      if (!response.ok && modelName === possibleModelNames[0]) {
        console.log(`[GeminiImage] Model ${modelName} failed (${response.status}), trying alternatives...`);
        // Clone the response before reading it
        const errorResponse = response.clone();
        const errorText = await errorResponse.text();
        console.log(`[GeminiImage] Error:`, errorText.substring(0, 500));
        
        for (const altName of possibleModelNames.slice(1)) {
          try {
            console.log(`[GeminiImage] Trying alternative model: ${altName}`);
            response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${altName}:generateContent?key=${encodeURIComponent(apiKey)}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
              }
            );
            if (response.ok) {
              modelName = altName;
              console.log(`[GeminiImage] ✅ Successfully using model: ${altName}`);
              break;
            } else {
              // Clone before reading
              const altErrorResponse = response.clone();
              const altError = await altErrorResponse.text();
              console.log(`[GeminiImage] Model ${altName} also failed:`, altError.substring(0, 200));
            }
          } catch (error) {
            console.log(`[GeminiImage] Model ${altName} threw error:`, error);
            continue;
          }
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[GeminiImage] API error: ${response.status} ${response.statusText}`, errorText);
        
        // Parse error to extract user-friendly message
        let userMessage = `Failed to generate image`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            userMessage = errorJson.error.message;
            // Extract just the first line if it's a multi-line error
            const firstLine = userMessage.split('\n')[0];
            userMessage = firstLine;
            
            // Simplify common errors
            if (response.status === 429) {
              userMessage = "Gemini API quota exceeded. Please wait a moment and try again, or check your billing plan.";
            } else if (response.status === 404) {
              userMessage = "Image generation model not available. Please try again later.";
            } else if (response.status === 400) {
              userMessage = "Invalid request to Gemini API. Please try a different prompt.";
            }
          }
        } catch (e) {
          // If JSON parsing fails, use status text
          userMessage = `Image generation failed: ${response.statusText}`;
        }
        
        throw new Error(userMessage);
      }

      const data = await response.json();
      
      console.log('[GeminiImage] =============================================');
      console.log('[GeminiImage] Model used:', modelName);
      console.log('[GeminiImage] Response status:', response.status);
      console.log('[GeminiImage] Full API response:');
      console.log(JSON.stringify(data, null, 2));
      console.log('[GeminiImage] =============================================');

      // Extract image from response
      // The response structure may vary, so we check multiple possible locations
      let imageBase64: string | undefined;
      let mimeType: string = 'image/png';
      let imageUrl: string | undefined;

      // Check for inlineData (base64)
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
      // Check for URL in text content or other fields
      // Also check all parts, not just the first one
      if (!imageBase64 && data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.text) {
            const text = part.text;
            // Try to extract URL from text (more comprehensive pattern)
            const urlMatch = text.match(/https?:\/\/[^\s\)]+/);
            if (urlMatch) {
              imageUrl = urlMatch[0];
              console.log('[GeminiImage] Found URL in response text:', imageUrl);
              break;
            }
          }
          // Also check for inlineData in any part
          if (part.inlineData) {
            imageBase64 = part.inlineData.data;
            mimeType = part.inlineData.mimeType || 'image/png';
            console.log('[GeminiImage] Found inlineData in part');
            break;
          }
        }
      }

      // If we have a URL but no base64, fetch the image and convert to base64
      if (imageUrl && !imageBase64) {
        try {
          console.log('[GeminiImage] Fetching image from URL and converting to base64...');
          console.log('[GeminiImage] Image URL:', imageUrl);
          
          // First try without API key
          let imageResponse = await fetch(imageUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0',
            }
          });
          
          // If that fails, try with API key
          if (!imageResponse.ok) {
            console.log('[GeminiImage] First fetch failed, trying with API key...');
            const urlWithKey = `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`;
            imageResponse = await fetch(urlWithKey, {
              headers: {
                'User-Agent': 'Mozilla/5.0',
              }
            });
          }
          
          if (imageResponse.ok) {
            const arrayBuffer = await imageResponse.arrayBuffer();
            imageBase64 = Buffer.from(arrayBuffer).toString('base64');
            mimeType = imageResponse.headers.get('content-type') || 'image/png';
            console.log('[GeminiImage] Successfully converted URL to base64, size:', imageBase64.length);
          } else {
            console.error('[GeminiImage] Failed to fetch image, status:', imageResponse.status);
            throw new Error(`Failed to fetch image: ${imageResponse.status} ${imageResponse.statusText}`);
          }
        } catch (fetchError: any) {
          console.error('[GeminiImage] Failed to fetch image from URL:', fetchError);
          // Re-throw so the route handler can try again
          throw new Error(`Failed to fetch image from URL: ${fetchError.message}`);
        }
      }

      if (!imageBase64 && !imageUrl) {
        console.error('[GeminiImage] No image data or URL found in response:', JSON.stringify(data, null, 2));
        throw new Error('No image data returned from Gemini Image API');
      }

      // If we still only have URL, return it (frontend will handle it)
      if (!imageBase64 && imageUrl) {
        // Return URL as base64 data URL format so frontend can handle it
        // Actually, let's return it as a special format
        return {
          imageBase64: imageUrl, // Store URL in base64 field for now
          mimeType: 'url', // Special marker
        };
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

