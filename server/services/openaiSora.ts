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
      const requestBody: any = {
        model: 'sora-1.0', // Sora model name
        prompt: prompt,
      };

      // Add optional parameters
      if (options.duration) {
        requestBody.duration = options.duration;
      }

      if (options.aspectRatio) {
        requestBody.aspect_ratio = options.aspectRatio;
      }

      console.log('[OpenAISora] Request body:', JSON.stringify(requestBody, null, 2));

      // Call OpenAI Sora API
      const response = await fetch('https://api.openai.com/v1/videos/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

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
        } else if (response.status === 404) {
          errorMessage = 'Sora model not available. It may not be available in your region or account yet.';
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('[OpenAISora] Response:', JSON.stringify(data, null, 2));

      // Extract video URL from response
      // OpenAI Sora typically returns: { data: [{ url: "...", ... }] }
      const videoUrl = data.data?.[0]?.url || data.url;

      if (!videoUrl) {
        console.error('[OpenAISora] No video URL in response:', data);
        throw new Error('No video URL returned from OpenAI API');
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

