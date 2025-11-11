import { userApiKeysService } from './userApiKeys';

/**
 * Service for Gemini Veo (Video Generation)
 * Uses the Gemini API's generateVideos endpoint (long-running operation)
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
      resolution?: '720p' | '1080p';
    } = {}
  ): Promise<{
    videoBase64?: string;
    videoUrl?: string;
    mimeType: string;
  }> {
    try {
      // Use Veo 3.1 Fast for quick generation (8 seconds max)
      const model = 'veo-3.1-fast-generate-preview';
      const baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
      
      console.log(`[GeminiVideo] Starting video generation with ${model}`);
      console.log(`[GeminiVideo] Prompt: ${prompt.substring(0, 100)}...`);

      // Build request body for Veo predictLongRunning endpoint
      const requestBody: any = {
        instances: [
          {
            prompt,
          },
        ],
        parameters: {
          numberOfVideos: 1,
        }
      };

      // Add optional parameters
      if (options.aspectRatio) {
        requestBody.parameters.aspectRatio = options.aspectRatio;
      }

      // Note: Veo 3.1 Fast doesn't support durationSeconds - always generates 8 seconds
      // Only add if using a different model that supports it
      if (options.durationSeconds && model !== 'veo-3.1-fast-generate-preview') {
        requestBody.parameters.durationSeconds = options.durationSeconds;
      }

      if (options.resolution) {
        requestBody.parameters.resolution = options.resolution;
      }

      console.log('[GeminiVideo] Request body:', JSON.stringify(requestBody, null, 2));

      // Step 1: Start the long-running video generation operation
      const startUrl = `${baseUrl}/models/${model}:predictLongRunning?key=${encodeURIComponent(apiKey)}`;
      
      const startResponse = await fetch(startUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        console.error('[GeminiVideo] Failed to start operation:', errorText);
        throw new Error(`Failed to start video generation: ${startResponse.status} ${startResponse.statusText}`);
      }

      const operationData = await startResponse.json();
      const operationName = operationData.name;
      
      if (!operationName) {
        console.error('[GeminiVideo] No operation name in response:', operationData);
        throw new Error('No operation name returned from video generation request');
      }

      console.log('[GeminiVideo] Operation started:', operationName);
      console.log('[GeminiVideo] Polling for completion (this may take 30-60 seconds)...');

      // Step 2: Poll the operation until it's done
      const pollUrl = `${baseUrl}/${operationName}?key=${encodeURIComponent(apiKey)}`;
      const maxAttempts = 60; // 10 minutes max (10 second intervals)
      let attempts = 0;
      let isDone = false;
      let finalResponse: any = null;

      while (!isDone && attempts < maxAttempts) {
        attempts++;
        
        // Wait 10 seconds between polls
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        const pollResponse = await fetch(pollUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!pollResponse.ok) {
          const errorText = await pollResponse.text();
          console.error('[GeminiVideo] Polling failed:', errorText);
          throw new Error(`Failed to poll operation: ${pollResponse.status} ${pollResponse.statusText}`);
        }

        finalResponse = await pollResponse.json();
        isDone = finalResponse.done === true;

        if (isDone) {
          console.log('[GeminiVideo] Operation complete!');
          console.log('[GeminiVideo] Final response:', JSON.stringify(finalResponse, null, 2));
        } else {
          console.log(`[GeminiVideo] Still processing... (attempt ${attempts}/${maxAttempts})`);
        }
      }

      if (!isDone) {
        throw new Error('Video generation timed out. Please try again.');
      }

      // Step 3: Extract video URL from the response
      const videoUri = finalResponse?.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
      
      if (!videoUri) {
        console.error('[GeminiVideo] No video URI in response:', finalResponse);
        throw new Error('No video URL returned from Gemini API');
      }

      console.log('[GeminiVideo] Video URI:', videoUri);

      // Return the video URL (with API key for download)
      const videoUrlWithKey = `${videoUri}?key=${encodeURIComponent(apiKey)}`;
      
      return {
        videoUrl: videoUrlWithKey,
        mimeType: 'video/mp4',
      };
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
      resolution?: '720p' | '1080p';
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

