import crypto from 'crypto';
import { db } from '../db';
import { integrations } from '../../shared/schema';
import { eq, and } from 'drizzle-orm';

// Encryption key - in production, this should be stored securely
const ENCRYPTION_KEY = process.env.API_KEY_ENCRYPTION_KEY || 'your-32-character-secret-key-here!';
const ALGORITHM = 'aes-256-gcm';

export class UserApiKeysService {
  /**
   * Encrypt an API key
   */
  private encryptApiKey(apiKey: string): string {
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine iv, authTag, and encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt an API key
   */
  private decryptApiKey(encryptedData: string): string {
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * Store a user's API key
   */
  async storeApiKey(userId: number, provider: string, apiKey: string, keyName?: string) {
    const encryptedKey = this.encryptApiKey(apiKey);
    
    // Check if user already has a key for this provider
    const existingKey = await db.select()
      .from(integrations)
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.serviceType, 'ai_model'),
        eq(integrations.serviceName, provider)
      ))
      .limit(1);

    if (existingKey.length > 0) {
      // Update existing key
      await db.update(integrations)
        .set({
          credentialsEncrypted: encryptedKey,
          isActive: true,
          updatedAt: new Date()
        })
        .where(eq(integrations.id, existingKey[0].id));
      
      return existingKey[0].id;
    } else {
      // Create new key
      const result = await db.insert(integrations).values({
        userId,
        serviceType: 'ai_model',
        serviceName: provider,
        credentialsEncrypted: encryptedKey,
        isActive: true
      }).returning({ id: integrations.id });
      
      return result[0].id;
    }
  }

  /**
   * Get a user's API key for a specific provider
   */
  async getApiKey(userId: number, provider: string): Promise<string | null> {
    // Normalize provider names (gemini <-> google are the same)
    const normalizedProvider = provider === 'gemini' ? 'google' : provider;
    const alternateProvider = provider === 'google' ? 'gemini' : null;
    
    // Try to find with normalized provider first, then alternate if needed
    let result = await db.select()
      .from(integrations)
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.serviceType, 'ai_model'),
        eq(integrations.serviceName, normalizedProvider),
        eq(integrations.isActive, true)
      ))
      .limit(1);
    
    // If not found and we have an alternate provider, try that
    if (result.length === 0 && alternateProvider) {
      result = await db.select()
        .from(integrations)
        .where(and(
          eq(integrations.userId, userId),
          eq(integrations.serviceType, 'ai_model'),
          eq(integrations.serviceName, alternateProvider),
          eq(integrations.isActive, true)
        ))
        .limit(1);
    }

    if (result.length === 0) {
      return null;
    }

    try {
      const decrypted = this.decryptApiKey(result[0].credentialsEncrypted);
      
      // Parse the credentials if it's JSON (contains apiKey field)
      try {
        const parsed = JSON.parse(decrypted);
        if (parsed.apiKey) {
          console.log(`[getApiKey] Parsed JSON credentials for ${provider}`);
          return parsed.apiKey;
        }
      } catch {
        // Not JSON, return as is
        console.log(`[getApiKey] Using raw API key for ${provider}`);
      }
      
      return decrypted;
    } catch (error) {
      console.error('Failed to decrypt API key:', error);
      return null;
    }
  }

  /**
   * Get all user's API keys (without decryption)
   */
  async getUserApiKeys(userId: number) {
    return await db.select({
      id: integrations.id,
      provider: integrations.serviceName,
      keyName: integrations.serviceName, // Using serviceName as keyName for now
      isActive: integrations.isActive,
      createdAt: integrations.createdAt
    })
    .from(integrations)
    .where(and(
      eq(integrations.userId, userId),
      eq(integrations.serviceType, 'ai_model')
    ));
  }

  /**
   * Delete a user's API key
   */
  async deleteApiKey(userId: number, provider: string) {
    await db.update(integrations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.serviceType, 'ai_model'),
        eq(integrations.serviceName, provider)
      ));
  }

  /**
   * Test an API key by making a simple request
   */
  async testApiKey(provider: string, apiKey: string): Promise<boolean> {
    try {
      // Parse the API key if it's JSON (from frontend)
      let actualApiKey = apiKey;
      try {
        const parsed = JSON.parse(apiKey);
        if (parsed.apiKey) {
          actualApiKey = parsed.apiKey;
          console.log(`[testApiKey] Parsed JSON credentials for ${provider}`);
        }
      } catch {
        // Not JSON, use as is
        console.log(`[testApiKey] Using raw API key for ${provider}`);
      }
      
      // Trim whitespace from API key
      const trimmedApiKey = actualApiKey.trim();
      
      // Normalize provider names (gemini -> google for API compatibility)
      const normalizedProvider = provider === 'gemini' ? 'google' : provider;
      
      console.log(`[testApiKey] Testing API key for provider: ${provider} (normalized: ${normalizedProvider})`);
      console.log(`[testApiKey] Key length: ${trimmedApiKey.length}`);
      console.log(`[testApiKey] Key preview: ${trimmedApiKey.substring(0, Math.min(10, trimmedApiKey.length))}...`);
      
      if (!trimmedApiKey) {
        console.error(`[testApiKey] Empty API key provided for ${provider}`);
        return false;
      }
      
      // Validate Gemini API key format
      if (normalizedProvider === 'google' && !trimmedApiKey.startsWith('AIza')) {
        console.error(`[testApiKey] ❌ Invalid Gemini API key format!`);
        console.error(`[testApiKey] Gemini keys should start with "AIza"`);
        console.error(`[testApiKey] Make sure you're using a Google AI Studio key from: https://aistudio.google.com/app/apikey`);
        return false;
      }
      
      switch (normalizedProvider) {
        case 'openai':
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${trimmedApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!openaiResponse.ok) {
            const errorText = await openaiResponse.text();
            console.error(`OpenAI API test failed: ${openaiResponse.status} ${openaiResponse.statusText}`, errorText);
          }
          
          return openaiResponse.ok;

        case 'anthropic':
          // First check format
          if (!trimmedApiKey.startsWith('sk-ant-') || trimmedApiKey.length < 50) {
            console.error(`Invalid Anthropic API key format. Expected key starting with 'sk-ant-' and at least 50 characters long. Got: ${trimmedApiKey.substring(0, 20)}...`);
            return false;
          }
          
          console.log(`[Anthropic] Testing API key format validated, making test API call...`);
          
          try {
            // Then test with actual API call
            const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
              method: 'POST',
              headers: {
                'x-api-key': trimmedApiKey,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
              },
              body: JSON.stringify({
                model: 'claude-3-5-sonnet-20241022',
                messages: [
                  {
                    role: 'user',
                    content: 'Hi'
                  }
                ],
                max_tokens: 10
              })
            });
            
            if (!anthropicResponse.ok) {
              const errorText = await anthropicResponse.text();
              console.error(`Anthropic API test failed: ${anthropicResponse.status} ${anthropicResponse.statusText}`, errorText);
              return false;
            }
            
            console.log(`[Anthropic] API key test successful`);
            return true;
          } catch (error) {
            console.error(`[Anthropic] API key test error:`, error);
            return false;
          }

        case 'google':
          // Test using the REST API directly (most reliable method)
          try {
            console.log(`[Google/Gemini] Starting API key validation...`);
            console.log(`[Google/Gemini] Key format check: ${trimmedApiKey.startsWith('AIza') ? '✅ Valid format' : '❌ Invalid format (should start with AIza)'}`);
            
            // URL encode the key to handle any special characters
            const encodedKey = encodeURIComponent(trimmedApiKey);
            const testUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodedKey}`;
            
            console.log(`[Google/Gemini] Making request to: ${testUrl.substring(0, 80)}...`);
            
            // First, test by listing models (free and quick)
            const listResponse = await fetch(testUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            console.log(`[Google/Gemini] Response status: ${listResponse.status} ${listResponse.statusText}`);
            
            if (!listResponse.ok) {
              const errorText = await listResponse.text();
              console.error(`[Google/Gemini] ❌ API key validation failed!`);
              console.error(`[Google/Gemini] Status: ${listResponse.status} ${listResponse.statusText}`);
              console.error(`[Google/Gemini] Error response:`, errorText);
              
              // Provide helpful error messages
              if (listResponse.status === 400) {
                console.error(`[Google/Gemini] 💡 This usually means: Invalid API key or key not activated`);
              } else if (listResponse.status === 403) {
                console.error(`[Google/Gemini] 💡 This usually means: API restrictions enabled or billing not set up`);
              } else if (listResponse.status === 401) {
                console.error(`[Google/Gemini] 💡 This usually means: Invalid API key format`);
              }
              
              return false;
            }
            
            const data = await listResponse.json();
            const modelCount = data.models?.length || 0;
            console.log(`[Google/Gemini] ✅ API key test successful!`);
            console.log(`[Google/Gemini] Found ${modelCount} available models`);
            
            if (modelCount > 0) {
              const geminiModels = data.models
                .filter((m: any) => m.name && m.name.includes('gemini'))
                .map((m: any) => m.name.replace('models/', ''))
                .slice(0, 5);
              console.log(`[Google/Gemini] Available Gemini models: ${geminiModels.join(', ')}`);
            }
            
            return true;
          } catch (error: any) {
            console.error(`[Google/Gemini] ❌ API test failed with exception:`);
            console.error(`[Google/Gemini] Error type: ${error?.constructor?.name || 'Unknown'}`);
            console.error(`[Google/Gemini] Error message:`, error?.message || error);
            console.error(`[Google/Gemini] Stack trace:`, error?.stack);
            return false;
          }

        case 'xai':
          const xaiResponse = await fetch('https://api.x.ai/v1/models', {
            headers: {
              'Authorization': `Bearer ${trimmedApiKey}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!xaiResponse.ok) {
            const errorText = await xaiResponse.text();
            console.error(`xAI API test failed: ${xaiResponse.status} ${xaiResponse.statusText}`, errorText);
          }
          
          return xaiResponse.ok;

        case 'perplexity':
          const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${trimmedApiKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              model: 'sonar-pro',
              messages: [{ role: 'user', content: 'test' }],
              max_tokens: 10
            })
          });
          
          if (!perplexityResponse.ok) {
            const errorText = await perplexityResponse.text();
            console.error(`Perplexity API test failed: ${perplexityResponse.status} ${perplexityResponse.statusText}`, errorText);
          }
          
          return perplexityResponse.ok;

        default:
          return false;
      }
    } catch (error) {
      console.error(`Failed to test ${provider} API key:`, error);
      return false;
    }
  }

  /**
   * Update last used timestamp (integrations table doesn't have lastUsed field)
   * We'll update the updatedAt field instead
   */
  async updateLastUsed(userId: number, provider: string) {
    await db.update(integrations)
      .set({ updatedAt: new Date() })
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.serviceType, 'ai_model'),
        eq(integrations.serviceName, provider)
      ));
  }
}

export const userApiKeysService = new UserApiKeysService();
