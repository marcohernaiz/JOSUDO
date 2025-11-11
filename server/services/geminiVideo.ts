import { userApiKeysService } from './userApiKeys';

/**
 * Service for Gemini Veo (Video Generation)
 * Uses direct API calls to Google's Generative Language API
 */
class GeminiVideoService {
  /**
   * Generate a video using Gemini Veo
   * @param prompt - Text prompt describing the video to generate
   * @param apiKey - User's Gemini API key
   * @param options - Generation options
   */
  async generateVideo(
    prompt: string,
    apiKey: string,
    options: {
      aspectRatio?: '9:16' | '16:9' | '1:1';
      durationSeconds?: number;
    } = {}
  ): Promise<{
    videoBase64?: string;
    videoUrl?: string;
    mimeType: string;
  }> {
    try {
      const possibleModelNames = [
        'veo-002',                    // Veo 2 (latest)
        'veo-001',                    // Veo 1
        'gemini-2.5-flash-video',    // Gemini 2.5 Flash with video generation
      ];

      let lastError: Error | null = null;
      let lastResponse: globalThis.Response | null = null;
      let lastResponseBody: any = null;

      const buildPredictBody = () => {
        const parameters: Record<string, any> = {
          numberOfVideos: 1,
        };

        if (options.aspectRatio) {
          parameters.aspectRatio = options.aspectRatio;
        }

        if (options.durationSeconds) {
          parameters.durationSeconds = options.durationSeconds;
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
        return {
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.4,
            responseModalities: ['VIDEO'],
          },
        };
      };

      const extractVideoFromPredict = (data: any) => {
        const prediction = data?.predictions?.[0];
        if (!prediction) {
          return null;
        }

        // Check for video in various possible locations
        if (prediction.video?.videoUri) {
          return {
            videoUrl: prediction.video.videoUri,
            mimeType: prediction.video.mimeType || 'video/mp4',
          };
        }

        if (prediction.video?.bytesBase64Encoded) {
          return {
            videoBase64: prediction.video.bytesBase64Encoded,
            mimeType: prediction.video.mimeType || 'video/mp4',
          };
        }

        if (prediction.videoUri) {
          return {
            videoUrl: prediction.videoUri,
            mimeType: 'video/mp4',
          };
        }

        return null;
      };

      const extractVideoFromGenerateContent = (data: any) => {
        if (data.candidates?.[0]?.content?.parts) {
          for (const part of data.candidates[0].content.parts) {
            if (part.inlineData?.data && part.inlineData?.mimeType?.startsWith('video/')) {
              return {
                videoBase64: part.inlineData.data,
                mimeType: part.inlineData.mimeType || 'video/mp4',
              };
            }

            if (part.fileData?.fileUri) {
              return {
                videoUrl: part.fileData.fileUri,
                mimeType: part.fileData.mimeType || 'video/mp4',
              };
            }

            if (part.text) {
              const urlMatch = part.text.match(/https?:\/\/[^\s)]+/);
              if (urlMatch) {
                return {
                  videoUrl: urlMatch[0],
                  mimeType: 'video/mp4',
                };
              }
            }
          }
        }

        return null;
      };

      for (const modelName of possibleModelNames) {
        // Veo and Gemini 2.5 models use v1beta, try both predict and generateContent
        const endpointOrder = ['predict', 'generateContent'];

        for (const endpointType of endpointOrder) {
          const apiVersion = 'v1beta';

          const url = `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:${endpointType}?key=${encodeURIComponent(apiKey)}`;
          const requestBody = endpointType === 'predict'
            ? buildPredictBody()
            : buildGenerateContentBody();

          try {
            console.log(`[GeminiVideo] Trying model: ${modelName} via ${endpointType}`);

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

              console.log(`[GeminiVideo] Model ${modelName} via ${endpointType} failed: ${errorMessage}`);
              lastError = new Error(errorMessage);

              // Try next endpoint/model
              continue;
            }

            console.log('[GeminiVideo] =============================================');
            console.log('[GeminiVideo] Model used:', modelName);
            console.log('[GeminiVideo] Endpoint:', endpointType);
            console.log('[GeminiVideo] Response status:', response.status);
            console.log('[GeminiVideo] Full API response:');
            console.log(JSON.stringify(responseJson, null, 2));
            console.log('[GeminiVideo] =============================================');

            let extractionResult: { videoBase64?: string; videoUrl?: string; mimeType: string } | null = null;

            if (endpointType === 'predict') {
              extractionResult = extractVideoFromPredict(responseJson);
            }

            if (!extractionResult) {
              extractionResult = extractVideoFromGenerateContent(responseJson);
            }

            if (extractionResult?.videoBase64 || extractionResult?.videoUrl) {
              // If we have a URL, we might need to fetch it
              if (extractionResult.videoUrl && !extractionResult.videoBase64) {
                console.log('[GeminiVideo] Video URL returned:', extractionResult.videoUrl);
                // For now, return the URL directly - frontend can handle it
                // In the future, we could fetch and convert to base64 if needed
              }

              return {
                videoBase64: extractionResult.videoBase64,
                videoUrl: extractionResult.videoUrl,
                mimeType: extractionResult.mimeType,
              };
            }

            // If we got a successful response but no video, log and continue
            console.log('[GeminiVideo] Response successful but no video data found');
            lastError = new Error('No video data returned from API');
          } catch (error) {
            console.log(`[GeminiVideo] Model ${modelName} via ${endpointType} threw error:`, error);
            lastError = error as Error;
          }
        }
      }

      // All models failed
      console.log('[GeminiVideo] Last response body:', JSON.stringify(lastResponseBody, null, 2));

      let userMessage = 'Failed to generate video';
      if (lastResponse) {
        if (lastResponse.status === 429) {
          userMessage = "Gemini API quota exceeded. Please wait a moment and try again, or check your billing plan.";
        } else if (lastResponse.status === 404) {
          userMessage = "Video generation model not available. Please try again later.";
        } else if (lastResponse.status === 400) {
          userMessage = "Invalid request to Gemini API. Please try a different prompt.";
        } else if (lastResponseBody?.error?.message) {
          userMessage = lastResponseBody.error.message.split('\n')[0];
        }
      } else if (lastError) {
        userMessage = lastError.message;
      }

      throw new Error(userMessage);
    } catch (error) {
      console.error('[GeminiVideo] Error generating video:', error);
      throw error;
    }
  }

  /**
   * Generate video for a user (gets API key from user's stored keys)
   */
  async generateVideoForUser(
    userId: number,
    prompt: string,
    options?: {
      aspectRatio?: '9:16' | '16:9' | '1:1';
      durationSeconds?: number;
    }
  ): Promise<{
    videoBase64?: string;
    videoUrl?: string;
    mimeType: string;
  }> {
    // Get user's Gemini API key (normalize gemini -> google)
    const apiKey = await userApiKeysService.getApiKey(userId, 'google');
    
    if (!apiKey) {
      throw new Error('Gemini API key not found. Please add your API key in Settings > Integrations.');
    }

    return this.generateVideo(prompt, apiKey, options);
  }
}

export const geminiVideoService = new GeminiVideoService();

