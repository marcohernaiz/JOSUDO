import { userApiKeysService } from './userApiKeys';

/**
 * Service for OpenAI Sora (Video Generation)
 * Uses OpenAI's direct API for video generation
 */
class OpenAISoraService {
  /**
   * Generate a video using OpenAI Sora
   * @param prompt - Text prompt describing the video to generate
   * @param apiKey - User's OpenAI API key
   * @param options - Generation options
   */
  async generateVideo(
    prompt: string,
    apiKey: string,
    options: {
      duration?: number; // Duration in seconds
      aspectRatio?: '16:9' | '9:16' | '1:1';
    } = {}
  ): Promise<{
    videoBase64?: string;
    videoUrl?: string;
    mimeType: string;
  }> {
    try {
      console.log('[OpenAISora] Starting video generation');
      console.log('[OpenAISora] Prompt:', prompt.substring(0, 100));

      // Build request body for Sora API
      // Based on OpenAI API patterns, Sora uses a simple structure
      const requestBody: any = {
        model: 'sora', // Sora model name
        prompt: prompt,
      };

      // Add optional parameters (only include supported ones)
      // Note: aspect_ratio is not supported by Sora API
      // Duration might be supported, but let's start minimal
      if (options.duration) {
        // Try duration_seconds or just duration - will be validated by API
        requestBody.duration = options.duration;
      }

      console.log('[OpenAISora] Request body:', JSON.stringify(requestBody, null, 2));

      // Try different possible endpoints for Sora
      // User suggested: https://api.openai.com/v1/videos
      const possibleEndpoints = [
        'https://api.openai.com/v1/videos', // User's suggestion
        'https://api.openai.com/v1/videos/generations', // Standard pattern
        'https://api.openai.com/v1/video/generations',
        'https://api.openai.com/v1/sora/generations',
      ];

      let lastError: Error | null = null;
      let response: globalThis.Response | null = null;

      // Try different model names and request formats
      const modelVariations = ['sora', 'sora-1.0', null]; // null means no model parameter
      
      for (const endpoint of possibleEndpoints) {
        for (const modelName of modelVariations) {
          try {
            // Create request body with or without model
            const bodyToSend = { ...requestBody };
            if (modelName) {
              bodyToSend.model = modelName;
            } else {
              delete bodyToSend.model; // Some endpoints don't need model parameter
            }

            console.log(`[OpenAISora] Trying endpoint: ${endpoint}, model: ${modelName || 'none'}`);
            response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(bodyToSend),
            });

            // If we get a 404 or 405, try next variation
            if (response.status === 404 || response.status === 405) {
              // Clone response to read error without consuming body
              const errorResponse = response.clone();
              const errorText = await errorResponse.text().catch(() => '');
              console.log(`[OpenAISora] Endpoint ${endpoint} with model ${modelName || 'none'} returned ${response.status}: ${errorText.substring(0, 200)}`);
              continue;
            }

            // If we get any other response, break and process it
            break;
          } catch (error) {
            console.log(`[OpenAISora] Endpoint ${endpoint} with model ${modelName || 'none'} failed:`, error);
            lastError = error as Error;
            continue;
          }
        }
        
        // If we got a valid response, break out of endpoint loop
        if (response && response.status !== 404 && response.status !== 405) {
          break;
        }
      }

      if (!response) {
        throw new Error('All Sora API endpoints failed. Sora may not be publicly available yet, or the API endpoint has changed.');
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[OpenAISora] API error:', errorText);
        
        let errorMessage = `Failed to generate video: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message;
          }
        } catch (e) {
          // Use the raw error text if JSON parsing fails
        }

        // Handle specific error cases
        if (response.status === 401) {
          errorMessage = 'Invalid OpenAI API key. Please check your API key in Settings.';
        } else if (response.status === 429) {
          errorMessage = 'OpenAI API rate limit exceeded. Please wait a moment and try again.';
        } else if (response.status === 404 || errorMessage.includes('Invalid method')) {
          errorMessage = 'Sora video generation is not yet publicly available via API. OpenAI has announced Sora but the API endpoint may not be live yet. Please check OpenAI\'s documentation for updates, or try using Gemini Veo for video generation in the meantime.';
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[OpenAISora] Response:', JSON.stringify(data, null, 2));

      // Extract video URL from response
      // OpenAI APIs typically return: { data: [{ url: "...", ... }] }
      // Or might return: { url: "...", ... } directly
      // Or might return: { video_url: "...", ... }
      const videoUrl = data.data?.[0]?.url 
        || data.data?.[0]?.video_url
        || data.url 
        || data.video_url
        || data.video?.url;

      if (!videoUrl) {
        console.error('[OpenAISora] No video URL in response:', data);
        throw new Error('No video URL returned from OpenAI API. Response structure may be different than expected.');
      }

      console.log('[OpenAISora] Video URL:', videoUrl);

      return {
        videoUrl: videoUrl,
        mimeType: 'video/mp4',
      };
    } catch (error) {
      console.error('[OpenAISora] Error generating video:', error);
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
      duration?: number;
      aspectRatio?: '16:9' | '9:16' | '1:1';
    }
  ): Promise<{
    videoBase64?: string;
    videoUrl?: string;
    mimeType: string;
  }> {
    // Get user's OpenAI API key
    const apiKey = await userApiKeysService.getApiKey(userId, 'openai');
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please add your API key in Settings > Integrations.');
    }

    return this.generateVideo(prompt, apiKey, options);
  }
}

export const openaiSoraService = new OpenAISoraService();

