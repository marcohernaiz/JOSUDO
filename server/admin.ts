import express from 'express';
import session from 'express-session';
import { storage } from './storage';
import crypto from 'crypto';
import { db } from './db';
import { appSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';

const adminApp = express();
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'josudo2025!';

// Encryption for secrets - optional AES-256-CBC with random IV
const ALGORITHM = 'aes-256-cbc';

// Get encryption key if provided (optional)
const ENCRYPTION_KEY_RAW = process.env.ENCRYPTION_KEY;
let ENCRYPTION_KEY: Buffer | null = null;

if (ENCRYPTION_KEY_RAW) {
  // Validate key length if provided
  if (ENCRYPTION_KEY_RAW.length !== 32) {
    console.warn(`WARNING: ENCRYPTION_KEY should be exactly 32 characters for AES-256`);
    console.warn(`Current length: ${ENCRYPTION_KEY_RAW.length}, required: 32`);
  } else {
    ENCRYPTION_KEY = Buffer.from(ENCRYPTION_KEY_RAW, 'utf-8');
    console.log('✓ Encryption enabled for API keys');
  }
} else {
  console.log('⚠ No ENCRYPTION_KEY set - API keys will be stored unencrypted');
}

export function encrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured - cannot encrypt');
  }
  const iv = crypto.randomBytes(16); // Generate random IV
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // Store IV with encrypted data
}

export function decrypt(text: string): string {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured - cannot decrypt');
  }
  const [ivHex, encryptedText] = text.split(':');
  if (!ivHex || !encryptedText) {
    throw new Error('Invalid encrypted data format');
  }
  const iv = Buffer.from(ivHex, 'hex'); // Use stored IV
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Database functions for settings
async function getSetting(key: string): Promise<string | null> {
  try {
    const result = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    if (result.length > 0) {
      const setting = result[0];
      return setting.isEncrypted ? decrypt(setting.value) : setting.value;
    }
    return null;
  } catch (error) {
    console.error('Error getting setting:', error);
    return null;
  }
}

async function setSetting(key: string, value: string, isEncrypted: boolean = true): Promise<void> {
  try {
    const storedValue = isEncrypted ? encrypt(value) : value;
    const existing = await db.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    
    if (existing.length > 0) {
      await db.update(appSettings)
        .set({ value: storedValue, isEncrypted, updatedAt: new Date() })
        .where(eq(appSettings.key, key));
    } else {
      await db.insert(appSettings).values({
        key,
        value: storedValue,
        isEncrypted
      });
    }
  } catch (error) {
    console.error('Error setting:', error);
  }
}

// Cache for frequently accessed settings (still keep some in-memory for performance)
let settingsCache: Record<string, string> = {};

// Seed initial platform API keys into database (unencrypted by default)
async function seedPlatformKeys() {
  try {
    // Define platform keys to seed from environment
    const platformKeys = [
      // LLM Provider API Keys
      'OPENAI_API_KEY',        // ChatGPT
      'ANTHROPIC_API_KEY',     // Claude
      'GOOGLE_API_KEY',        // Gemini
      'GROK_API_KEY',          // Grok
      'PERPLEXITY_API_KEY',    // Perplexity
      'DEEPSEEK_API_KEY',      // DeepSeek
      'OPENROUTER_API_KEY',    // OpenRouter
      'REPLICATE_API_TOKEN',   // Replicate
      // Other Platform Keys
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLIC_KEY',
      'TESTING_STRIPE_SECRET_KEY',
      'TESTING_VITE_STRIPE_PUBLIC_KEY',
      'DATABASE_URL',
      'SESSION_SECRET',
      'ADMIN_USERNAME',
      'ADMIN_PASSWORD',
    ];

    // LLM provider keys with placeholder values (for admin UI display)
    const llmPlaceholders: Record<string, string> = {
      'ANTHROPIC_API_KEY': 'sk-ant-placeholder',
      'GOOGLE_API_KEY': 'AIza-placeholder',
      'GROK_API_KEY': 'xai-placeholder',
      'PERPLEXITY_API_KEY': 'pplx-placeholder',
      'DEEPSEEK_API_KEY': 'sk-placeholder',
      'REPLICATE_API_TOKEN': 'r8_placeholder',
    };

    for (const key of platformKeys) {
      const envValue = process.env[key];
      
      // Check if key already exists in database
      const [existing] = await db
        .select()
        .from(appSettings)
        .where(eq(appSettings.key, key))
        .limit(1);

      if (!existing) {
        // Use environment value if available, otherwise use placeholder for LLM keys
        const value = envValue || llmPlaceholders[key];
        
        if (value) {
          // Seed the key into database UNENCRYPTED by default
          await db.insert(appSettings).values({
            key,
            value,
            isEncrypted: false,
          });
          console.log(`✓ Seeded ${envValue ? 'platform' : 'placeholder'} key: ${key}`);
        }
      }
    }
  } catch (error) {
    console.error('Error seeding platform keys:', error);
  }
}

// Load settings into cache on startup
async function loadSettings() {
  try {
    // Try to access the table, if it fails, it might not exist yet
    const settings = await db.select().from(appSettings);
    settings.forEach((setting: { key: string; value: string; isEncrypted: boolean }) => {
      // Skip if value is null or undefined
      if (!setting.value) {
        console.warn(`Skipping setting ${setting.key} - value is null/undefined`);
        return;
      }
      
      try {
        const value = setting.isEncrypted ? decrypt(setting.value) : setting.value;
        settingsCache[setting.key] = value;
        process.env[setting.key] = value; // Also set as env var for compatibility
      } catch (decryptError) {
        console.error(`Error decrypting setting ${setting.key}:`, decryptError);
      }
    });
    console.log('Loaded', settings.length, 'settings from database');
  } catch (error) {
    console.error('Error loading settings (table might not exist yet):', error);
    console.log('Note: Run "npm run db:push" to create the appSettings table');
  }
}

// Initialize settings cache and seed platform keys
async function initializeSettings() {
  await seedPlatformKeys();
  await loadSettings();
}

initializeSettings();

adminApp.use(express.json({ limit: '50mb' }));
adminApp.use(express.urlencoded({ extended: true, limit: '50mb' }));
adminApp.use(session({
  secret: 'admin-secret-key-josudo',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// Admin authentication middleware
const requireAdminAuth = (req: any, res: any, next: any) => {
  if (req.session?.adminAuthenticated) {
    return next();
  }
  res.redirect('/admin/login');
};

// Login page
adminApp.get('/admin/login', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Josudo Admin Panel</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 40px; }
        .container { max-width: 400px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; text-align: center; margin-bottom: 30px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #374151; }
        input { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; background: #2563eb; color: white; padding: 12px; border: none; border-radius: 4px; font-size: 16px; cursor: pointer; }
        button:hover { background: #1d4ed8; }
        .error { color: #dc2626; margin-bottom: 20px; padding: 10px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🤖 Josudo Admin Panel</h1>
        ${req.query.error ? '<div class="error">Invalid credentials</div>' : ''}
        <form method="POST" action="/admin/login">
          <div class="form-group">
            <label for="username">Username:</label>
            <input type="text" id="username" name="username" required>
          </div>
          <div class="form-group">
            <label for="password">Password:</label>
            <input type="password" id="password" name="password" required>
          </div>
          <button type="submit">Sign In</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Login handler
adminApp.post('/admin/login', (req: any, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.adminAuthenticated = true;
    res.redirect('/admin/dashboard');
  } else {
    res.redirect('/admin/login?error=1');
  }
});

// Old HTML Dashboard - DISABLED to allow React SPA to handle /admin/dashboard
// The React-based admin dashboard is now the primary admin interface
// This old HTML route is commented out to prevent conflicts with the React app
/*
adminApp.get('/admin/dashboard', (req, res) => {
  const hasOpenAI = !!settingsCache.OPENAI_API_KEY;
  const hasStripeSecret = !!settingsCache.STRIPE_SECRET_KEY;
  const hasStripePublic = !!settingsCache.VITE_STRIPE_PUBLIC_KEY;
  const hasReplicate = !!settingsCache.REPLICATE_API_TOKEN;
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Josudo Admin Dashboard</title>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f7fa; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #2563eb; margin: 0; }
        h2 { color: #374151; margin-top: 0; }
        .status { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
        .status.connected { background: #d1fae5; color: #065f46; }
        .status.disconnected { background: #fee2e2; color: #991b1b; }
        .form-group { margin-bottom: 15px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; color: #374151; }
        input { width: 100%; padding: 10px; border: 1px solid #d1d5db; border-radius: 4px; box-sizing: border-box; }
        button { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #1d4ed8; }
        .logout { float: right; background: #dc2626; }
        .logout:hover { background: #b91c1c; }
        .success { color: #065f46; margin-bottom: 10px; padding: 10px; background: #d1fae5; border: 1px solid #a7f3d0; border-radius: 4px; }
        .error { color: #991b1b; margin-bottom: 10px; padding: 10px; background: #fee2e2; border: 1px solid #fecaca; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🤖 Josudo Admin Dashboard</h1>
          <a href="/admin/logout"><button class="logout">Logout</button></a>
        </div>
        
        <div class="card">
          <h2>API Keys Status</h2>
          <p><strong>OpenAI:</strong> <span class="status ${hasOpenAI ? 'connected' : 'disconnected'}">${hasOpenAI ? 'Connected' : 'Not Connected'}</span></p>
          <p><strong>Replicate:</strong> <span class="status ${hasReplicate ? 'connected' : 'disconnected'}">${hasReplicate ? 'Connected' : 'Not Connected'}</span></p>
          <p><strong>Stripe Secret:</strong> <span class="status ${hasStripeSecret ? 'connected' : 'disconnected'}">${hasStripeSecret ? 'Connected' : 'Not Connected'}</span></p>
          <p><strong>Stripe Public:</strong> <span class="status ${hasStripePublic ? 'connected' : 'disconnected'}">${hasStripePublic ? 'Connected' : 'Not Connected'}</span></p>
        </div>

        <div class="card">
          <h2>Configure API Keys</h2>
          ${req.query.success ? '<div class="success">API keys updated successfully!</div>' : ''}
          ${req.query.error ? '<div class="error">Failed to update API keys. Please try again.</div>' : ''}
          
          <form method="POST" action="/admin/update-keys">
            <div class="form-group">
              <label for="openai">OpenAI API Key:</label>
              <input type="password" id="openai" name="OPENAI_API_KEY" placeholder="sk-..." value="${settingsCache.OPENAI_API_KEY ? '***hidden***' : ''}">
            </div>
            
            <div class="form-group">
              <label for="replicate">Replicate API Token:</label>
              <input type="password" id="replicate" name="REPLICATE_API_TOKEN" placeholder="r8_..." value="${settingsCache.REPLICATE_API_TOKEN ? '***hidden***' : ''}">
            </div>
            
            <div class="form-group">
              <label for="stripe_secret">Stripe Secret Key:</label>
              <input type="password" id="stripe_secret" name="STRIPE_SECRET_KEY" placeholder="sk_..." value="${settingsCache.STRIPE_SECRET_KEY ? '***hidden***' : ''}">
            </div>
            
            <div class="form-group">
              <label for="stripe_public">Stripe Publishable Key:</label>
              <input type="text" id="stripe_public" name="VITE_STRIPE_PUBLIC_KEY" placeholder="pk_..." value="${settingsCache.VITE_STRIPE_PUBLIC_KEY || ''}">
            </div>
            
            <button type="submit">Update API Keys</button>
          </form>
        </div>

        <div class="card">
          <h2>Instructions</h2>
          <h3>Getting Your API Keys:</h3>
          <p><strong>OpenAI:</strong> Visit <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a> and create a new secret key.</p>
          <p><strong>Replicate:</strong> Visit <a href="https://replicate.com/account/api-tokens" target="_blank">replicate.com/account/api-tokens</a> and create a new API token.</p>
          <p><strong>Stripe:</strong> Visit <a href="https://dashboard.stripe.com/apikeys" target="_blank">dashboard.stripe.com/apikeys</a> and copy both your secret key and publishable key.</p>
          
          <h3>Security:</h3>
          <p>• API keys are stored securely and never logged</p>
          <p>• Only provide the secret key (starts with sk_) for Stripe Secret</p>
          <p>• The publishable key (starts with pk_) is safe to be public</p>
        </div>
      </div>
    </body>
    </html>
  `);
});
*/

// Update keys handler (old HTML admin - keep authentication for security)
adminApp.post('/admin/update-keys', requireAdminAuth, async (req: any, res) => {
  const { OPENAI_API_KEY, REPLICATE_API_TOKEN, STRIPE_SECRET_KEY, VITE_STRIPE_PUBLIC_KEY } = req.body;
  
  try {
    if (OPENAI_API_KEY && OPENAI_API_KEY !== '***hidden***') {
      const trimmedKey = OPENAI_API_KEY.trim();
      await setSetting('OPENAI_API_KEY', trimmedKey);
      settingsCache.OPENAI_API_KEY = trimmedKey;
      process.env.OPENAI_API_KEY = trimmedKey;
    }
    
    if (REPLICATE_API_TOKEN && REPLICATE_API_TOKEN !== '***hidden***') {
      const trimmedToken = REPLICATE_API_TOKEN.trim();
      await setSetting('REPLICATE_API_TOKEN', trimmedToken);
      settingsCache.REPLICATE_API_TOKEN = trimmedToken;
      process.env.REPLICATE_API_TOKEN = trimmedToken;
    }
    
    if (STRIPE_SECRET_KEY && STRIPE_SECRET_KEY !== '***hidden***') {
      const trimmedKey = STRIPE_SECRET_KEY.trim();
      await setSetting('STRIPE_SECRET_KEY', trimmedKey);
      settingsCache.STRIPE_SECRET_KEY = trimmedKey;
      process.env.STRIPE_SECRET_KEY = trimmedKey;
    }
    
    if (VITE_STRIPE_PUBLIC_KEY) {
      const trimmedKey = VITE_STRIPE_PUBLIC_KEY.trim();
      await setSetting('VITE_STRIPE_PUBLIC_KEY', trimmedKey, false); // Public key doesn't need encryption
      settingsCache.VITE_STRIPE_PUBLIC_KEY = trimmedKey;
      process.env.VITE_STRIPE_PUBLIC_KEY = trimmedKey;
    }
    
    console.log('Successfully updated API keys in database');
    res.redirect('/admin/dashboard?success=1');
  } catch (error) {
    console.error('Error updating API keys:', error);
    res.redirect('/admin/dashboard?error=1');
  }
});

// Logout
adminApp.get('/admin/logout', (req: any, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Export secrets getter for main app
export const getSecret = (key: string) => settingsCache[key] || process.env[key];
export const setSecret = async (key: string, value: string) => {
  await setSetting(key, value);
  settingsCache[key] = value;
  process.env[key] = value;
};

export default adminApp;