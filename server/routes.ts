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
  // Session configuration
  app.use(session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration (only if Google OAuth is available)
  if (hasGoogleAuth) {
    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "/api/auth/google/callback"
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
    app.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
    
    app.get('/api/auth/google/callback', 
      passport.authenticate('google', { failureRedirect: '/auth' }),
      (req, res) => {
        res.redirect('/dashboard');
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

  // Chat routes
  app.post('/api/chat/send', authenticateUser, async (req, res) => {
    try {
      const { message, sessionId, model } = req.body;
      const userId = (req.user as any).id;

      // Get or create chat session
      let chatSession;
      if (sessionId) {
        chatSession = await storage.getChatSession(sessionId);
      } else {
        chatSession = await storage.createChatSession({
          userId,
          title: message.substring(0, 50) + "...",
          modelUsed: model || "deepseek-chat"
        });
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
            // Check if user has OpenAI integration
            const openaiIntegration = await storage.getIntegration(userId, "openai");
            if (openaiIntegration && openaiIntegration.isActive) {
              response = await openaiService.sendMessage(message, openaiIntegration.credentialsEncrypted);
              tokensUsed = response.usage?.total_tokens || 0;
              cost = openaiService.calculateCost(tokensUsed);
            } else {
              // Fallback to DeepSeek if no API key
              serviceResponse = await deepseekService.sendMessage(message);
              response = { choices: [{ message: { content: `[Using DeepSeek - No OpenAI API key configured]\n\n${serviceResponse.response}` } }] };
              tokensUsed = serviceResponse.tokens;
              cost = serviceResponse.cost;
            }
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

      // Log usage
      await storage.createUsageLog({
        userId,
        chatSessionId: chatSession?.id || 0,
        modelUsed: model || "deepseek-chat",
        tokensConsumed: tokensUsed,
        cost: cost.toString(),
        isPremiumAccount: isPremium
      });

      // Save to Google Drive if configured
      const driveIntegration = await storage.getIntegration(userId, "google_drive");
      if (driveIntegration) {
        if (chatSession) {
          await googleDriveService.saveChatMessage(
            chatSession.id.toString(),
            message,
            response.choices[0].message.content || '',
            driveIntegration.credentialsEncrypted || ''
          );
        }
      }

      res.json({
        response: response.choices[0].message.content,
        sessionId: chatSession?.id,
        tokens: tokensUsed,
        tokensUsed,
        cost: cost.toString()
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/chat/sessions', authenticateUser, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const sessions = await storage.getChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch chat sessions' });
    }
  });

  app.delete('/api/chat/sessions/:id', authenticateUser, async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      await storage.deleteChatSession(sessionId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete chat session' });
    }
  });

  // Integration routes
  app.get('/api/integrations', authenticateUser, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const integrations = await storage.getIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch integrations' });
    }
  });

  app.post('/api/integrations', authenticateUser, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const validation = insertIntegrationSchema.parse({ ...req.body, userId });
      
      const integration = await storage.createIntegration(validation);
      res.json(integration);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create integration' });
    }
  });

  app.delete('/api/integrations/:id', authenticateUser, async (req, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      await storage.deleteIntegration(integrationId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete integration' });
    }
  });

  // Billing routes
  app.get('/api/billing', authenticateUser, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const billing = await storage.getBilling(userId);
      const usageLogs = await storage.getUsageLogs(userId, 30);
      
      res.json({
        billing,
        recentUsage: usageLogs
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch billing information' });
    }
  });

  app.post('/api/billing/topup', authenticateUser, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { amount } = req.body;
      
      const paymentIntent = await billingService.createPaymentIntent(amount);
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        amount: amount 
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  app.post('/api/billing/confirm-payment', authenticateUser, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const { amount } = req.body;
      
      await storage.addBalance(userId, amount);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to confirm payment' });
    }
  });

  // Usage analytics
  app.get('/api/usage', authenticateUser, async (req, res) => {
    try {
      const userId = (req.user as any).id;
      const usageLogs = await storage.getUsageLogs(userId, 100);
      
      res.json(usageLogs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch usage data' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
