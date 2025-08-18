import express from 'express';
import session from 'express-session';
import { storage } from './storage';
import crypto from 'crypto';

const adminApp = express();
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'josudo2025!';

// Simple in-memory secret storage for MVP
let secrets: Record<string, string> = {};

adminApp.use(express.json());
adminApp.use(express.urlencoded({ extended: true }));
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

// Dashboard
adminApp.get('/admin/dashboard', requireAdminAuth, (req, res) => {
  const hasOpenAI = !!secrets.OPENAI_API_KEY;
  const hasStripeSecret = !!secrets.STRIPE_SECRET_KEY;
  const hasStripePublic = !!secrets.VITE_STRIPE_PUBLIC_KEY;
  const hasReplicate = !!secrets.REPLICATE_API_TOKEN;
  
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
          
          <form method="POST" action="/admin/update-keys">
            <div class="form-group">
              <label for="openai">OpenAI API Key:</label>
              <input type="password" id="openai" name="OPENAI_API_KEY" placeholder="sk-..." value="${secrets.OPENAI_API_KEY ? '***hidden***' : ''}">
            </div>
            
            <div class="form-group">
              <label for="replicate">Replicate API Token:</label>
              <input type="password" id="replicate" name="REPLICATE_API_TOKEN" placeholder="r8_..." value="${secrets.REPLICATE_API_TOKEN ? '***hidden***' : ''}">
            </div>
            
            <div class="form-group">
              <label for="stripe_secret">Stripe Secret Key:</label>
              <input type="password" id="stripe_secret" name="STRIPE_SECRET_KEY" placeholder="sk_..." value="${secrets.STRIPE_SECRET_KEY ? '***hidden***' : ''}">
            </div>
            
            <div class="form-group">
              <label for="stripe_public">Stripe Publishable Key:</label>
              <input type="text" id="stripe_public" name="VITE_STRIPE_PUBLIC_KEY" placeholder="pk_..." value="${secrets.VITE_STRIPE_PUBLIC_KEY || ''}">
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

// Update keys handler
adminApp.post('/admin/update-keys', requireAdminAuth, (req: any, res) => {
  const { OPENAI_API_KEY, REPLICATE_API_TOKEN, STRIPE_SECRET_KEY, VITE_STRIPE_PUBLIC_KEY } = req.body;
  
  if (OPENAI_API_KEY && OPENAI_API_KEY !== '***hidden***') {
    secrets.OPENAI_API_KEY = OPENAI_API_KEY.trim();
    process.env.OPENAI_API_KEY = OPENAI_API_KEY.trim();
  }
  
  if (REPLICATE_API_TOKEN && REPLICATE_API_TOKEN !== '***hidden***') {
    secrets.REPLICATE_API_TOKEN = REPLICATE_API_TOKEN.trim();
    process.env.REPLICATE_API_TOKEN = REPLICATE_API_TOKEN.trim();
  }
  
  if (STRIPE_SECRET_KEY && STRIPE_SECRET_KEY !== '***hidden***') {
    secrets.STRIPE_SECRET_KEY = STRIPE_SECRET_KEY.trim();
    process.env.STRIPE_SECRET_KEY = STRIPE_SECRET_KEY.trim();
  }
  
  if (VITE_STRIPE_PUBLIC_KEY) {
    secrets.VITE_STRIPE_PUBLIC_KEY = VITE_STRIPE_PUBLIC_KEY.trim();
    process.env.VITE_STRIPE_PUBLIC_KEY = VITE_STRIPE_PUBLIC_KEY.trim();
  }
  
  res.redirect('/admin/dashboard?success=1');
});

// Logout
adminApp.get('/admin/logout', (req: any, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Export secrets getter for main app
export const getSecret = (key: string) => secrets[key] || process.env[key];
export const setSecret = (key: string, value: string) => {
  secrets[key] = value;
  process.env[key] = value;
};

export default adminApp;