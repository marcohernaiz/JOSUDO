import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { storage } from "./storage";
import { openaiService } from "./services/openai";
import { googleDriveService } from "./services/googleDrive";
import { billingService } from "./services/billing";
import { deepseekService } from "./services/deepseek";
import { claudeService } from "./services/claude";
import { geminiService } from "./services/gemini";
import { grokService } from "./services/grok";
import { llamaService } from "./services/llama";
import { authenticateUser } from "./middleware/auth";
import { insertChatSessionSchema, insertIntegrationSchema, insertUsageLogSchema } from "@shared/schema";
import { z } from "zod";

// Google OAuth will be configured dynamically or skipped for admin-only mode
const hasGoogleAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy for HTTPS detection
  app.set('trust proxy', 1);
  
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production', 
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration (only if Google OAuth is available)
  if (hasGoogleAuth) {
    // Get the current domain for the callback URL
    const getCallbackURL = (req: any) => {
      const protocol = req.secure ? 'https' : 'http';
      const host = req.get('host');
      return `${protocol}://${host}/api/auth/google/callback`;
    };

    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "https://8fdbab7c-95d5-4874-bfbd-1fd1ebf7f828-00-nad6e6v3p5fi.picard.replit.dev/api/auth/google/callback"
    }, async (accessToken: any, refreshToken: any, profile: any, done: any) => {
    try {
      let user = await storage.getUserByGoogleId(profile.id);
      
      if (!user) {
        user = await storage.createUser({
          googleId: profile.id,
          email: profile.emails?.[0]?.value || "",
          username: profile.displayName || "",
          avatar: profile.photos?.[0]?.value || "",
        });
        
        // Create initial billing record
        await storage.createBilling({
          userId: user.id,
          monthlyBalance: "9.99",
          overageAmount: "0.00"
        });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
    }));
  }

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes (only if Google OAuth is configured)
  if (hasGoogleAuth) {
    app.get('/api/auth/google', (req, res, next) => {
      const service = req.query.service;
      const scope = service === 'storage' 
        ? ['profile', 'email', 'https://www.googleapis.com/auth/drive.file']
        : ['profile', 'email'];
      
      passport.authenticate('google', { scope })(req, res, next);
    });
    
    app.get('/api/auth/google/callback', 
      passport.authenticate('google', { failureRedirect: '/auth' }),
      (req, res) => {
        const service = req.query.service;
        if (service === 'storage') {
          // Redirect back to dashboard with storage connected
          res.redirect('/dashboard?storage=connected');
        } else {
          res.redirect('/dashboard');
        }
      }
    );
  }

  // Demo login for testing without Google OAuth
  app.post('/api/auth/demo-login', async (req, res) => {
    try {
      let user = await storage.getUserByEmail('demo@josudo.com');
      
      if (!user) {
        user = await storage.createUser({
          email: 'demo@josudo.com',
          username: 'Demo User',
          subscriptionStatus: 'trial'
        });
        
        await storage.createBilling({
          userId: user.id,
          monthlyBalance: "25.00",
          overageAmount: "0.00"
        });
      }
      
      (req as any).session.userId = user.id;
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create demo user' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get('/api/auth/logout', (req, res) => {
    req.logout(() => {
      res.redirect('/');
    });
  });

  app.get('/api/auth/user', async (req, res) => {
    const session = req as any;
    
    // Check for Google OAuth authentication
    if (req.isAuthenticated()) {
      return res.json(req.user);
    }
    
    // Check for session-based authentication
    if (session.session?.userId) {
      try {
        const user = await storage.getUser(session.session.userId);
        if (user) {
          return res.json(user);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    }
    
    res.status(401).json({ error: 'Not authenticated' });
  });

  // Chat routes - No authentication required
  app.post('/api/chat/send', async (req, res) => {
    try {
      const { message, model } = req.body;

      const userId = (req as any).session?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      let response;
      let cost = 0;
      let tokensUsed = 0;
      let serviceResponse;

      // Route to appropriate AI service based on model
      try {
        switch (model) {
          case 'deepseek-chat':
            serviceResponse = await deepseekService.sendMessage(message);
            response = { choices: [{ message: { content: serviceResponse.response } }] };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;
          
          case 'gpt-4':
          case 'gpt-4o':
            // Fallback to DeepSeek since no user API keys
            serviceResponse = await openaiService.sendMessage(message, userId);
            response = { choices: [{ message: { content: serviceResponse.choices[0].message.content } }] };
            tokensUsed = serviceResponse.usage?.total_tokens || 0;
            cost =
              ((serviceResponse.usage?.prompt_tokens ?? 0) / 1000) * 0.01 +
              ((serviceResponse.usage?.completion_tokens ?? 0) / 1000) * 0.03;
            break;

          case 'claude-3-5-sonnet':
            serviceResponse = await claudeService.sendMessage(message);
            response = { choices: [{ message: { content: serviceResponse.response } }] };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case 'gemini-pro':
            serviceResponse = await geminiService.sendMessage(message);
            response = { choices: [{ message: { content: serviceResponse.response } }] };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case 'grok-beta':
            serviceResponse = await grokService.sendMessage(message);
            response = { choices: [{ message: { content: serviceResponse.response } }] };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case 'llama-3':
            serviceResponse = await llamaService.sendMessage(message);
            response = { choices: [{ message: { content: serviceResponse.response } }] };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          default:
            // Default to DeepSeek for any unknown model
            serviceResponse = await deepseekService.sendMessage(message);
            response = { choices: [{ message: { content: serviceResponse.response } }] };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;
        }
      } catch (error) {
        console.error(`Error with ${model}:`, error);
        // Fallback to DeepSeek on any error
        serviceResponse = await deepseekService.sendMessage(message);
        response = { choices: [{ message: { content: `[Fallback to DeepSeek - ${model} unavailable]\n\n${serviceResponse.response}` } }] };
        tokensUsed = serviceResponse.tokens;
        cost = serviceResponse.cost;
      }

      res.json({
        response: response.choices[0].message.content,
        tokens: tokensUsed,
        tokensUsed,
        cost: cost.toString()
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/chat/sessions', async (req, res) => {
    try {
      // Return empty array since no user accounts
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  });

  app.delete('/api/chat/sessions/:id', async (req, res) => {
    try {
      // Mock success response since no user accounts
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete chat session' });
    }
  });

  // Integration routes - No authentication required, return empty arrays
  app.get('/api/integrations', async (req, res) => {
    try {
      // Return empty array since no user accounts
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  });

  app.post('/api/integrations', async (req, res) => {
    try {
      // Mock success response since no user accounts
      res.json({ success: true, message: 'Integration not stored - no user accounts' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create integration' });
    }
  });

  app.delete('/api/integrations/:id', async (req, res) => {
    try {
      // Mock success response since no user accounts
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete integration' });
    }
  });

  // Billing routes - No authentication required, return mock data
  app.get('/api/billing', async (req, res) => {
    try {
      // Return mock billing data since no user accounts
      res.json({
        billing: {
          id: 1,
          userId: 1,
          monthlyBalance: "25.00",
          lastBillingDate: new Date(),
          overageAmount: "0.00"
        },
        recentUsage: []
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch billing information' });
    }
  });

  app.post('/api/billing/topup', async (req, res) => {
    try {
      // Mock success response since no user accounts
      res.json({ 
        success: true,
        message: 'Payment not processed - no user accounts' 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  app.post('/api/billing/confirm-payment', async (req, res) => {
    try {
      // Mock success response since no user accounts
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to confirm payment' });
    }
  });

  // Usage analytics - No authentication required, return empty array
  app.get('/api/usage', async (req, res) => {
    try {
      // Return empty array since no user accounts
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch usage data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
