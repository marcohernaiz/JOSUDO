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
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    
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
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
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
    const result = await db.select()
      .from(integrations)
      .where(and(
        eq(integrations.userId, userId),
        eq(integrations.serviceType, 'ai_model'),
        eq(integrations.serviceName, provider),
        eq(integrations.isActive, true)
      ))
      .limit(1);

    if (result.length === 0) {
      return null;
    }

    try {
      return this.decryptApiKey(result[0].credentialsEncrypted);
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
      switch (provider) {
        case 'openai':
          const openaiResponse = await fetch('https://api.openai.com/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          return openaiResponse.ok;

        case 'anthropic':
          const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'test' }]
            })
          });
          return anthropicResponse.ok;

        case 'google':
          const googleResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
            headers: {
              'x-goog-api-key': apiKey
            }
          });
          return googleResponse.ok;

        case 'xai':
          const xaiResponse = await fetch('https://api.x.ai/v1/models', {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Content-Type': 'application/json'
            }
          });
          return xaiResponse.ok;

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
