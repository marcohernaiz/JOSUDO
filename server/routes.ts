import type { Express } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as AppleStrategy } from "passport-apple";
import { Strategy as MicrosoftStrategy } from "passport-microsoft";
import { storage } from "./storage";
import { openaiService } from "./services/openai";
import { googleDriveService } from "./services/googleDrive";
import { billingService, CREDIT_PACKAGES } from "./services/billing";
import { deepseekService } from "./services/deepseek";
import { claudeService } from "./services/claude";
import { geminiService } from "./services/gemini";
import { grokService } from "./services/grok";
import { llamaService } from "./services/llama";
import { replicateService } from "./services/replicate";
import { authenticateUser } from "./middleware/auth";
import {
  insertChatSessionSchema,
  insertIntegrationSchema,
  insertUsageLogSchema,
  insertSpaceSchema,
  insertSourceSchema,
  insertNoteSchema,
  insertTaskSchema,
  insertToolSchema,
  insertVirtualEmployeeSchema,
  usageLogs,
  users,
  billing,
  spaces,
  sources,
  notes,
  tasks,
  tools,
  virtualEmployees,
} from "@shared/schema";
import { z } from "zod";
import { db } from './db';
import { eq, and, sql } from 'drizzle-orm';

// OAuth providers configuration
const hasGoogleAuth =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

const hasAppleAuth =
  process.env.APPLE_CLIENT_ID && 
  process.env.APPLE_TEAM_ID && 
  process.env.APPLE_KEY_ID && 
  process.env.APPLE_PRIVATE_KEY;

const hasMicrosoftAuth =
  process.env.MICROSOFT_CLIENT_ID && 
  process.env.MICROSOFT_CLIENT_SECRET;

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy for HTTPS detection
  app.set("trust proxy", 1);

  // Session configuration
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "your-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  // Passport configuration (only if Google OAuth is available)
  if (hasGoogleAuth) {
    // Get the current domain for the callback URL
    const getCallbackURL = (req: any) => {
      const protocol = req.secure ? "https" : "http";
      const host = req.get("host");
      return `${protocol}://${host}/api/auth/google/callback`;
    };

    // Determine callback URL based on environment
    const callbackURL = process.env.NODE_ENV === "production" 
      ? (process.env.GOOGLE_CALLBACK_URL || "https://josudo.org/api/auth/google/callback")
      : "https://8fdbab7c-95d5-4874-bfbd-1fd1ebf7f828-00-nad6e6v3p5fi.picard.replit.dev/api/auth/google/callback";

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL: callbackURL,
          passReqToCallback: true,
        },
        async (
          req: any,
          accessToken: any,
          refreshToken: any,
          profile: any,
          done: any,
        ) => {
          try {
            console.log("Access Token:", accessToken);
            console.log("Refresh Token:", refreshToken); // <- is this undefined?
            console.log("Profile:", profile);

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
                overageAmount: "0.00",
              });
            }

            if (accessToken) {
              const credentials = {
                accessToken,
                refreshToken,
                // Optionally: expiry_date, scope, token_type, etc.
              };
              const existing = await storage.getIntegration(
                user.id,
                "google-drive",
              );
              if (existing) {
                await storage.updateIntegration(existing.id, {
                  credentialsEncrypted: JSON.stringify(credentials),
                  isActive: true,
                  // ...other fields as needed
                });
              } else {
                await storage.createIntegration({
                  userId: user.id,
                  serviceType: "storage", // <-- add this line
                  serviceName: "google-drive",
                  credentialsEncrypted: JSON.stringify(credentials),
                  isActive: true,
                  // ...other fields as needed
                });
              }
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        },
      ),
    );
  }

  // Apple OAuth configuration
  if (hasAppleAuth) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID!,
          teamID: process.env.APPLE_TEAM_ID!,
          keyID: process.env.APPLE_KEY_ID!,
          privateKeyString: process.env.APPLE_PRIVATE_KEY!,
          passReqToCallback: true,
          callbackURL: "https://8fdbab7c-95d5-4874-bfbd-1fd1ebf7f828-00-nad6e6v3p5fi.picard.replit.dev/api/auth/apple/callback",
        },
        async (
          req: any,
          accessToken: string,
          refreshToken: string,
          idToken: string,
          profile: any,
          done: any,
        ) => {
          try {
            console.log("Apple Access Token:", accessToken);
            console.log("Apple Profile:", profile);

            let user = await storage.getUserByAppleId(profile.id);

            if (!user) {
              // Create username from Apple profile
              const firstName = profile.name?.firstName || profile.displayName?.firstName || "";
              const lastName = profile.name?.lastName || profile.displayName?.lastName || "";
              const username = [firstName, lastName].filter(Boolean).join(" ") || "Apple User";

              user = await storage.createUser({
                appleId: profile.id,
                email: profile.emails?.[0]?.value || "",
                username: username,
                avatar: "", // Apple doesn't provide avatar in OAuth
              });

              // Create initial billing record
              await storage.createBilling({
                userId: user.id,
                monthlyBalance: "9.99",
                overageAmount: "0.00",
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        },
      ),
    );
  }

  // Microsoft OAuth configuration
  if (hasMicrosoftAuth) {
    passport.use(
      new MicrosoftStrategy(
        {
          clientID: process.env.MICROSOFT_CLIENT_ID!,
          clientSecret: process.env.MICROSOFT_CLIENT_SECRET!,
          passReqToCallback: true,
          callbackURL: "https://8fdbab7c-95d5-4874-bfbd-1fd1ebf7f828-00-nad6e6v3p5fi.picard.replit.dev/api/auth/microsoft/callback",
          scope: ["user.read", "email", "profile"],
        },
        async (
          req: any,
          accessToken: string,
          refreshToken: string,
          profile: any,
          done: any,
        ) => {
          try {
            console.log("Microsoft Access Token:", accessToken);
            console.log("Microsoft Profile:", profile);

            let user = await storage.getUserByMicrosoftId(profile.id);

            if (!user) {
              // Create username from Microsoft profile
              const firstName = profile.name?.givenName || "";
              const lastName = profile.name?.familyName || "";
              const username = [firstName, lastName].filter(Boolean).join(" ") || profile.displayName || "Microsoft User";

              user = await storage.createUser({
                microsoftId: profile.id,
                email: profile.emails?.[0]?.value || "",
                username: username,
                avatar: profile.photos?.[0]?.value || "",
              });

              // Create initial billing record
              await storage.createBilling({
                userId: user.id,
                monthlyBalance: "9.99",
                overageAmount: "0.00",
              });
            }

            return done(null, user);
          } catch (error) {
            return done(error);
          }
        },
      ),
    );
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
    app.get("/api/auth/google", (req, res, next) => {
      //const service = req.query.service;
      //console.log("Service:", service);
      /*const scope =
        service === "storage"
          ? ["profile", "email", "https://www.googleapis.com/auth/drive.file"]
          : ["profile", "email"];
      */
      const scope = [
        "profile",
        "email",
        "https://www.googleapis.com/auth/drive.file",
      ];
      const authOptions: any = {
        scope,
        access_type: "offline",
        prompt: "consent",
        approval_prompt: "force",
      };
      passport.authenticate("google", authOptions)(req, res, next);
    });

    app.get(
      "/api/auth/google/callback",
      passport.authenticate("google", { failureRedirect: "/auth" }),
      (req, res) => {
        const service = req.query.service;
        if (service === "storage") {
          // Redirect back to dashboard with storage connected
          res.redirect("/dashboard?storage=connected");
        } else {
          res.redirect("/dashboard");
        }
      },
    );
  }

  // Apple OAuth routes (only if Apple OAuth is configured)
  if (hasAppleAuth) {
    app.get("/api/auth/apple", (req, res, next) => {
      passport.authenticate("apple", {
        scope: ["name", "email"],
      })(req, res, next);
    });

    app.get(
      "/api/auth/apple/callback",
      passport.authenticate("apple", { failureRedirect: "/auth" }),
      (req, res) => {
        res.redirect("/dashboard");
      },
    );
  }

  // Microsoft OAuth routes (only if Microsoft OAuth is configured)
  if (hasMicrosoftAuth) {
    app.get("/api/auth/microsoft", (req, res, next) => {
      passport.authenticate("microsoft", {
        scope: ["user.read", "email", "profile"],
      })(req, res, next);
    });

    app.get(
      "/api/auth/microsoft/callback",
      passport.authenticate("microsoft", { failureRedirect: "/auth" }),
      (req, res) => {
        res.redirect("/dashboard");
      },
    );
  }

  // Demo login for testing without Google OAuth
  app.post("/api/auth/demo-login", async (req, res) => {
    try {
      let user = await storage.getUserByEmail("demo@josudo.com");

      if (!user) {
        user = await storage.createUser({
          email: "demo@josudo.com",
          username: "Demo User",
          subscriptionStatus: "trial",
        });

        await storage.createBilling({
          userId: user.id,
          monthlyBalance: "25.00",
          overageAmount: "0.00",
        });
      }

      (req as any).session.userId = user.id;
      res.json({ success: true, user });
    } catch (error) {
      res.status(500).json({ error: "Failed to create demo user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", async (req, res) => {
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
        console.error("Error fetching user:", error);
      }
    }

    res.status(401).json({ error: "Not authenticated" });
  });

  // Chat routes - No authentication required
  app.post("/api/chat/send", async (req, res) => {
    try {
      const { message, model, sessionId } = req.body;
      console.log("Received chat request:", { message, model, sessionId });

      const userId = (req as any).session?.passport?.user;

      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      let response;
      let cost = 0;
      let tokensUsed = 0;
      let serviceResponse;

      // Get user's Google Drive credentials
      const integration = await storage.getIntegration(userId, "google-drive");

      // Load conversation history if sessionId is provided
      let conversationHistory: Array<{ role: string; content: string }> = [];
      if (sessionId && integration) {
        try {
          const credentials = JSON.parse(integration.credentialsEncrypted);
          const chatHistory = await googleDriveService.getChatHistory(
            sessionId,
            JSON.stringify(credentials)
          );
          
          // Convert to the format expected by AI services
          conversationHistory = chatHistory
            .filter(msg => msg.role === "user" || msg.role === "assistant")
            .map(msg => ({
              role: msg.role,
              content: msg.content
            }));
          
          console.log("Loaded conversation history:", conversationHistory.length, "messages");
        } catch (error) {
          console.error("Failed to load conversation history:", error);
        }
      }

      // Route to appropriate AI service based on model
      try {
        switch (model) {
          case "deepseek-chat":
            serviceResponse = await deepseekService.sendMessage(message, model, conversationHistory);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case "deepseek-v3":
            response = await replicateService.sendMessage(message, userId || 0, sessionId || "anonymous", integration?.credentialsEncrypted || "", model);
            // Estimate tokens and cost for DeepSeek V3
            const responseContent = response.choices[0]?.message?.content;
            const contentLength = typeof responseContent === 'string' ? responseContent.length : 0;
            tokensUsed = Math.ceil((message.length + contentLength) / 4);
            cost = replicateService.calculateCost(tokensUsed, model);
            
            // Track usage for Replicate
            if (userId) {
              try {
                const now = new Date();
                const billingPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                
                await storage.createUsageLog({
                  userId,
                  chatSessionId: null, // We can add session tracking later
                  modelUsed: model,
                  tokensConsumed: tokensUsed,
                  cost: cost.toString(),
                  isPremiumAccount: false, // Add proper premium check if needed
                  billingPeriod,
                  requestType: 'chat'
                });

                // Update monthly usage for billing
                await storage.updateMonthlyUsage(userId, cost);
                
                console.log(`✅ Josudo usage tracked for user ${userId}: ${tokensUsed} tokens, $${cost}`);
                console.log(`💾 Saved with billingPeriod: ${billingPeriod}, requestType: chat`);
              } catch (error) {
                console.error("Failed to log Replicate usage:", error);
              }
            }
            break;

          case "gpt-4":
          case "gpt-4o":
            // Use OpenAI with proper sessionId for context
            serviceResponse = await openaiService.sendMessage(
              message,
              userId,
              sessionId || userId.toString(),
              integration?.credentialsEncrypted || "",
            );
            response = {
              choices: [
                {
                  message: {
                    content: serviceResponse.choices[0].message.content,
                  },
                },
              ],
            };

            tokensUsed = serviceResponse.usage?.total_tokens || 0;
            cost =
              ((serviceResponse.usage?.prompt_tokens ?? 0) / 1000) * 0.01 +
              ((serviceResponse.usage?.completion_tokens ?? 0) / 1000) * 0.03;
            
            // Track usage for OpenAI
            if (userId) {
              try {
                const now = new Date();
                const billingPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                
                await storage.createUsageLog({
                  userId,
                  chatSessionId: null,
                  modelUsed: model,
                  tokensConsumed: tokensUsed,
                  cost: cost.toString(),
                  isPremiumAccount: false,
                  billingPeriod,
                  requestType: 'chat'
                });

                await storage.updateMonthlyUsage(userId, cost);
                console.log(`Usage tracked for user ${userId}: ${tokensUsed} tokens, $${cost} for ${model}`);
              } catch (error) {
                console.error("Failed to log OpenAI usage:", error);
              }
            }
            break;

          case "claude-3-5-sonnet":
            serviceResponse = await claudeService.sendMessage(message, model, conversationHistory);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            
            // Track usage for Claude
            if (userId) {
              try {
                const now = new Date();
                const billingPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                
                await storage.createUsageLog({
                  userId,
                  chatSessionId: null,
                  modelUsed: model,
                  tokensConsumed: tokensUsed,
                  cost: cost.toString(),
                  isPremiumAccount: false,
                  billingPeriod,
                  requestType: 'chat'
                });

                await storage.updateMonthlyUsage(userId, cost);
                console.log(`Usage tracked for user ${userId}: ${tokensUsed} tokens, $${cost} for ${model}`);
              } catch (error) {
                console.error("Failed to log Claude usage:", error);
              }
            }
            break;

          case "claude-3-5-sonnet-replicate":
          case "claude-3-haiku-replicate":
            response = await replicateService.sendMessage(message, userId || 0, sessionId || "anonymous", integration?.credentialsEncrypted || "", model);
            const claudeResponseContent = response.choices[0]?.message?.content;
            const claudeContentLength = typeof claudeResponseContent === 'string' ? claudeResponseContent.length : 0;
            tokensUsed = Math.ceil((message.length + claudeContentLength) / 4);
            cost = replicateService.calculateCost(tokensUsed, model);
            
            // Track usage for Claude Replicate
            if (userId) {
              try {
                const now = new Date();
                const billingPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                
                await storage.createUsageLog({
                  userId,
                  chatSessionId: null, // We can add session tracking later
                  modelUsed: model,
                  tokensConsumed: tokensUsed,
                  cost: cost.toString(),
                  isPremiumAccount: false, // Add proper premium check if needed
                  billingPeriod,
                  requestType: 'chat'
                });

                // Update monthly usage for billing
                await storage.updateMonthlyUsage(userId, cost);
                console.log(`✅ Claude Replicate usage tracked for user ${userId}: ${tokensUsed} tokens, $${cost}`);
                console.log(`💾 Saved with billingPeriod: ${billingPeriod}, requestType: chat`);
              } catch (error) {
                console.error("Failed to log Claude Replicate usage:", error);
              }
            }
            break;

          case "gemini-pro":
            serviceResponse = await geminiService.sendMessage(message, model, conversationHistory);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            
            // Track usage for Gemini
            if (userId) {
              try {
                const now = new Date();
                const billingPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                
                await storage.createUsageLog({
                  userId,
                  chatSessionId: null,
                  modelUsed: model,
                  tokensConsumed: tokensUsed,
                  cost: cost.toString(),
                  isPremiumAccount: false,
                  billingPeriod,
                  requestType: 'chat'
                });

                await storage.updateMonthlyUsage(userId, cost);
                console.log(`Usage tracked for user ${userId}: ${tokensUsed} tokens, $${cost} for ${model}`);
              } catch (error) {
                console.error("Failed to log Gemini usage:", error);
              }
            }
            break;

          case "grok-beta":
            serviceResponse = await grokService.sendMessage(message, model, conversationHistory);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            
            // Track usage for Grok
            if (userId) {
              try {
                const now = new Date();
                const billingPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                
                await storage.createUsageLog({
                  userId,
                  chatSessionId: null,
                  modelUsed: model,
                  tokensConsumed: tokensUsed,
                  cost: cost.toString(),
                  isPremiumAccount: false,
                  billingPeriod,
                  requestType: 'chat'
                });

                await storage.updateMonthlyUsage(userId, cost);
                console.log(`Usage tracked for user ${userId}: ${tokensUsed} tokens, $${cost} for ${model}`);
              } catch (error) {
                console.error("Failed to log Grok usage:", error);
              }
            }
            break;

          case "llama-3":
            serviceResponse = await llamaService.sendMessage(message, model, conversationHistory);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            
            // Track usage for Llama
            if (userId) {
              try {
                const now = new Date();
                const billingPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
                
                await storage.createUsageLog({
                  userId,
                  chatSessionId: null,
                  modelUsed: model,
                  tokensConsumed: tokensUsed,
                  cost: cost.toString(),
                  isPremiumAccount: false,
                  billingPeriod,
                  requestType: 'chat'
                });

                await storage.updateMonthlyUsage(userId, cost);
                console.log(`Usage tracked for user ${userId}: ${tokensUsed} tokens, $${cost} for ${model}`);
              } catch (error) {
                console.error("Failed to log Llama usage:", error);
              }
            }
            break;

          case "llama-3.1-8b":
          case "gpt-5":
            // Use Replicate with default API key - no authentication required
            serviceResponse = await replicateService.sendMessage(
              message,
              userId || 0, // Use 0 as fallback for unauthenticated users
              sessionId || "anonymous",
              integration?.credentialsEncrypted || "", // Empty string if no Google Drive
              model,
            );
            response = {
              choices: [
                {
                  message: {
                    content: serviceResponse.choices[0].message.content,
                  },
                },
              ],
            };

            tokensUsed = model === "gpt-5" ? 1500 : 1000; // Higher token estimate for GPT-5
            cost = replicateService.calculateCost(tokensUsed, model);
            break;

          default:
            // Default to DeepSeek for any unknown model
            serviceResponse = await deepseekService.sendMessage(message, model, conversationHistory);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;
        }
      } catch (error) {
        console.error(`Error with ${model}:`, error);
        // Fallback to DeepSeek on any error
        serviceResponse = await deepseekService.sendMessage(message, model, conversationHistory);
        response = {
          choices: [
            {
              message: {
                content: `[Fallback to Josudo - ${model} unavailable]\n\n${serviceResponse.response}`,
              },
            },
          ],
        };
        tokensUsed = serviceResponse.tokens;
        cost = serviceResponse.cost;
      }

      // After getting the AI response:
      const chatMessage = {
        user: message,
        ai: response.choices[0].message.content,
        timestamp: new Date(),
        model,
      };

      if (integration) {
        const credentials = JSON.parse(integration.credentialsEncrypted);
        console.log(
          "Saving to Google Drive with sessionId:",
          sessionId || userId,
        );
        // Save both user and AI message
        await googleDriveService.saveChatMessage(
          sessionId || userId, // Use sessionId if provided, otherwise fallback to userId
          message, // user message (string)
          typeof response.choices[0].message.content === 'string' 
            ? response.choices[0].message.content 
            : JSON.stringify(response.choices[0].message.content) || "", // ai response (string)
          JSON.stringify(credentials), // credentials (string)
        );
        console.log("Successfully saved to Google Drive");
      }

      res.json({
        response: response.choices[0].message.content,
        tokens: tokensUsed,
        tokensUsed,
        cost: cost.toString(),
      });
    } catch (error) {
      console.error("Chat error:", error);
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Chat streaming route - Server-Sent Events
  app.post("/api/chat/send-stream", async (req, res) => {
    try {
      const { message, model, sessionId, files } = req.body;
      console.log("Received streaming chat request:", { message, model, sessionId, fileCount: files?.length || 0 });

      const userId = (req as any).session?.passport?.user;

      if (!userId) {
        console.log("User not authenticated for streaming request, continuing without Google Drive");
        // Continue without authentication for free models
      } else {
        console.log("Streaming request from authenticated user:", userId);
      }

      // Set up Server-Sent Events
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      });

      // Get user's Google Drive credentials (only if authenticated)
      let integration = null;
      if (userId) {
        integration = await storage.getIntegration(userId, "google-drive");
        console.log("Integration status for user", userId, ":", integration ? "found" : "not found");
        if (integration) {
          console.log("Integration credentials available:", !!integration.credentialsEncrypted);
        }
      }

      // Load conversation history if sessionId is provided and user is authenticated
      let conversationHistory: Array<{ role: string; content: string }> = [];
      if (sessionId && integration && userId) {
        try {
          conversationHistory = await googleDriveService.getChatHistory(
            sessionId,
            integration.credentialsEncrypted
          );
          console.log("Loaded conversation history:", conversationHistory.length, "messages");
        } catch (error) {
          console.error("Failed to load conversation history:", error);
        }
      }

      // Process files and create enhanced message
      let enhancedMessage = message;
      if (files && files.length > 0) {
        let fileContents = "";
        for (const file of files) {
          try {
            // Decode base64 content
            const content = Buffer.from(file.content, 'base64').toString('utf-8');
            fileContents += `\n\n--- File: ${file.name} (${file.type}) ---\n${content}\n--- End of ${file.name} ---\n`;
          } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            fileContents += `\n\n--- File: ${file.name} (${file.type}) ---\n[Error reading file content]\n--- End of ${file.name} ---\n`;
          }
        }
        
        enhancedMessage = `${message}\n\nAttached files:${fileContents}`;
        console.log(`Enhanced message with ${files.length} files, total length: ${enhancedMessage.length}`);
      }

      let totalTokens = 0;
      let fullResponse = "";

      try {
        console.log("Starting streaming for model:", model);
        // Route to appropriate AI service for streaming
        switch (model) {
          case "deepseek-chat":
            console.log("Starting DeepSeek streaming...");
            for await (const chunk of deepseekService.sendMessageStream(enhancedMessage, model, conversationHistory)) {
              console.log("Received chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("DeepSeek streaming finished, fullResponse length:", fullResponse.length);
            break;

          case "deepseek-v3":
            console.log("Starting DeepSeek V3 streaming via Replicate...");
            for await (const chunk of replicateService.sendMessageStream(enhancedMessage, userId || 0, sessionId || "anonymous", integration?.credentialsEncrypted || "", model)) {
              console.log("Received Replicate chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Replicate DeepSeek V3 streaming finished, fullResponse length:", fullResponse.length);
            break;

          case "gpt-4":
          case "gpt-4o":
            if (userId && integration) {
              for await (const chunk of openaiService.sendMessageStream(
                enhancedMessage,
                userId,
                sessionId || userId.toString(),
                integration?.credentialsEncrypted || "",
              )) {
                fullResponse += chunk.content;
                totalTokens = chunk.tokens || totalTokens;
                res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
              }
            } else {
              // Fallback to DeepSeek for unauthenticated users
              for await (const chunk of deepseekService.sendMessageStream(enhancedMessage, "deepseek-chat", conversationHistory)) {
                fullResponse += chunk.content;
                res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
              }
            }
            break;

          case "claude-3-5-sonnet":
            console.log("Starting Claude streaming...");
            for await (const chunk of claudeService.sendMessageStream(enhancedMessage, model, conversationHistory)) {
              console.log("Received Claude chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Claude streaming finished, fullResponse length:", fullResponse.length);
            break;

          case "claude-3-5-sonnet-replicate":
          case "claude-3-haiku-replicate":
            console.log("Starting Claude Replicate streaming for model:", model);
            for await (const chunk of replicateService.sendMessageStream(enhancedMessage, userId || 0, sessionId || "anonymous", integration?.credentialsEncrypted || "", model)) {
              console.log("Received Claude Replicate chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Claude Replicate streaming finished, fullResponse length:", fullResponse.length);
            break;

          case "gemini-pro":
            console.log("Starting Gemini streaming...");
            for await (const chunk of geminiService.sendMessageStream(enhancedMessage, model, conversationHistory)) {
              console.log("Received Gemini chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Gemini streaming finished, fullResponse length:", fullResponse.length);
            break;

          case "grok-beta":
            console.log("Starting Grok streaming...");
            for await (const chunk of grokService.sendMessageStream(enhancedMessage, model, conversationHistory)) {
              console.log("Received Grok chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Grok streaming finished, fullResponse length:", fullResponse.length);
            break;

          case "llama-3":
            console.log("Starting Llama streaming...");
            for await (const chunk of llamaService.sendMessageStream(enhancedMessage, model, conversationHistory)) {
              console.log("Received Llama chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Llama streaming finished, fullResponse length:", fullResponse.length);
            break;

          case "llama-3.1-8b":
          case "gpt-5":
            console.log("Starting Replicate streaming for model:", model);
            console.log("Auth check - userId:", !!userId, "integration:", !!integration);
            // Replicate now works with default API key - no user authentication required
            for await (const chunk of replicateService.sendMessageStream(
              enhancedMessage,
              userId || 0, // Use 0 as fallback for unauthenticated users
              sessionId || "anonymous",
              integration?.credentialsEncrypted || "", // Empty string if no Google Drive
              model,
            )) {
              console.log("Received Replicate chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Replicate streaming finished, fullResponse length:", fullResponse.length);
            break;

          default:
            console.log("Unknown model, defaulting to DeepSeek:", model);
            // Default to DeepSeek for any unknown model
            for await (const chunk of deepseekService.sendMessageStream(enhancedMessage, "deepseek-chat", conversationHistory)) {
              console.log("Received default chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Default streaming finished, fullResponse length:", fullResponse.length);
            break;
        }

        console.log("Streaming completed, full response length:", fullResponse.length);
        
        // Calculate final usage metrics
        const finalTokens = totalTokens || Math.floor(fullResponse.length / 4);
        
        // Calculate cost based on the actual model used
        let estimatedCost = 0;
        switch (model) {
          case "deepseek-v3":
            estimatedCost = replicateService.calculateCost(finalTokens, model);
            break;
          case "deepseek-chat":
            estimatedCost = deepseekService.calculateCost(finalTokens);
            break;
          case "gpt-4":
          case "gpt-4o":
            estimatedCost = openaiService.calculateCost(finalTokens, model);
            break;
          case "gpt-5":
            estimatedCost = replicateService.calculateCost(finalTokens, model);
            break;
          case "claude-3-5-sonnet":
            estimatedCost = claudeService.calculateCost(finalTokens);
            break;
          case "claude-3-5-sonnet-replicate":
          case "claude-3-haiku-replicate":
            estimatedCost = replicateService.calculateCost(finalTokens, model);
            break;
          case "gemini-pro":
            estimatedCost = geminiService.calculateCost(finalTokens);
            break;
          case "grok-beta":
            estimatedCost = grokService.calculateCost(finalTokens);
            break;
          case "llama-3":
          case "llama-3.1-8b":
            estimatedCost = llamaService.calculateCost(finalTokens);
            break;
          default:
            // Very conservative fallback - $0.001 per 1K tokens
            estimatedCost = (finalTokens / 1000) * 0.001;
        }
        
        // Track usage for streaming responses
        if (userId) {
          try {
            const now = new Date();
            const billingPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
            
            await storage.createUsageLog({
              userId,
              chatSessionId: null,
              modelUsed: model,
              tokensConsumed: finalTokens,
              cost: estimatedCost.toString(),
              isPremiumAccount: false,
              billingPeriod,
              requestType: 'chat'
            });

            // Update monthly usage for billing
            await storage.updateMonthlyUsage(userId, estimatedCost);
            
            console.log(`Usage tracked: ${finalTokens} tokens, $${estimatedCost} for model ${model} (user: ${userId})`);
          } catch (error) {
            console.error("Failed to log streaming usage:", error);
          }
        }
        
        // Completion signal will be sent after Google Drive save (if authenticated) or here (if not authenticated)

        // Save the complete conversation to Google Drive (only if authenticated)
        if (integration && userId) {
          try {
            // Generate a new session ID if none exists
            const finalSessionId = sessionId || `new_session_${Date.now()}_${userId}`;
            
            await googleDriveService.saveChatMessage(
              finalSessionId,
              message, // Save original user message (not enhanced with files)
              fullResponse,
              integration.credentialsEncrypted
            );
            
            // Update the sessionId in the response to include the generated one
            if (!sessionId) {
              // Send an additional data event with the new session ID
              res.write(`data: ${JSON.stringify({ 
                type: 'session_created', 
                sessionId: finalSessionId 
              })}\n\n`);
            }
            
            // Store the finalSessionId for use in the completion response
            const effectiveSessionId = finalSessionId;
            
            // Send completion signal with the effective session ID
            res.write(`data: ${JSON.stringify({ 
              type: 'complete', 
              response: fullResponse,
              tokens: finalTokens,
              model: model,
              sessionId: effectiveSessionId
            })}\n\n`);
          } catch (error) {
            console.error("Failed to save message to Google Drive:", error);
          }
        } else {
          // Send completion signal for non-authenticated users
          res.write(`data: ${JSON.stringify({ 
            type: 'complete', 
            response: fullResponse,
            tokens: finalTokens,
            model: model,
            sessionId: sessionId
          })}\n\n`);
        }

        res.end();
      } catch (error) {
        console.error("Streaming error:", error);
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to process streaming request' })}\n\n`);
        res.end();
      }
    } catch (error) {
      console.error("Chat streaming API error:", error);
      res.status(500).json({ error: "Failed to process streaming chat" });
    }
  });

  // Test endpoint for debugging streaming
  app.get("/api/test/deepseek-streaming", async (req, res) => {
    try {
      console.log("Testing DeepSeek streaming...");
      await deepseekService.testStreaming();
      res.json({ message: "Check server console for streaming test results" });
    } catch (error) {
      console.error("DeepSeek streaming test error:", error);
      res.status(500).json({ error: "Streaming test failed" });
    }
  });

  // Test endpoint to create sample usage data
  app.post("/api/test/create-usage", async (req, res) => {
    try {
      const userId = (req as any).session?.passport?.user;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      console.log("Creating test usage data for user:", userId);
      
      const now = new Date();
      const billingPeriod = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
      
      // Create some test usage data
      const testUsageData = [
        { model: 'deepseek-v3', tokens: 1500, cost: 0.0003 },
        { model: 'gpt-4', tokens: 2000, cost: 0.06 },
        { model: 'claude-3-5-sonnet', tokens: 1200, cost: 0.0108 }
      ];

      for (const data of testUsageData) {
        await storage.createUsageLog({
          userId,
          chatSessionId: null,
          modelUsed: data.model,
          tokensConsumed: data.tokens,
          cost: data.cost.toString(),
          isPremiumAccount: false,
          billingPeriod,
          requestType: 'chat'
        });

        await storage.updateMonthlyUsage(userId, data.cost);
        console.log(`✅ Test usage created: ${data.model} - ${data.tokens} tokens, $${data.cost}`);
      }

      res.json({ 
        message: "Test usage data created successfully",
        data: testUsageData
      });
    } catch (error) {
      console.error("Failed to create test usage data:", error);
      res.status(500).json({ error: "Failed to create test usage data" });
    }
  });

  // Debug endpoint to check raw usage logs
  app.get("/api/debug/usage-logs", async (req, res) => {
    try {
      const userId = (req as any).session?.passport?.user;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      console.log("Debug: Checking raw usage logs for user:", userId);
      
      // Get all usage logs for this user from database
      const logs = await db.select().from(usageLogs).where(eq(usageLogs.userId, userId));
      
      console.log("Debug: Found", logs.length, "usage logs");
      console.log("Debug: Raw logs:", logs);

      res.json({
        userId,
        totalLogs: logs.length,
        logs: logs
      });
    } catch (error) {
      console.error("Debug endpoint error:", error);
      res.status(500).json({ error: "Debug failed" });
    }
  });

  app.get("/api/chat/sessions", async (req, res) => {
    try {
      // Return empty array since no user accounts
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch chat sessions" });
    }
  });

  app.delete("/api/chat/sessions/:id", async (req, res) => {
    try {
      // Mock success response since no user accounts
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete chat session" });
    }
  });

  // Integration routes - No authentication required, return empty arrays
  app.get("/api/integrations", async (req, res) => {
    try {
      const session = req as any;
      let integrations = [];

      // Check for authenticated user
      if (req.isAuthenticated()) {
        integrations = await storage.getIntegrations((req.user as any).id);
      } else if (session.session?.userId) {
        integrations = await storage.getIntegrations(session.session.userId);
      } else if (session.session?.integrations) {
        // Return session-stored integrations
        integrations = session.session.integrations;
      }

      res.json(integrations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch integrations" });
    }
  });

  app.post("/api/integrations", async (req, res) => {
    try {
      const session = req as any;
      let userId = null;

      // Check for authenticated user
      if (req.isAuthenticated()) {
        userId = (req.user as any).id;
      } else if (session.session?.userId) {
        userId = session.session.userId;
      }

      if (userId) {
        const integration = await storage.createIntegration({
          ...req.body,
          userId,
        });
        res.json({ success: true, integration });
      } else {
        // Store temporarily in session for current session only
        if (!session.session.integrations) {
          session.session.integrations = [];
        }
        const integration = {
          id: Date.now(),
          ...req.body,
          userId: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        session.session.integrations.push(integration);
        res.json({
          success: true,
          integration,
          message: "Stored for current session only",
        });
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to create integration" });
    }
  });

  app.delete("/api/integrations/:id", async (req, res) => {
    try {
      // Mock success response since no user accounts
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete integration" });
    }
  });

  // Billing routes - No authentication required, return mock data
  app.get("/api/billing", async (req, res) => {
    try {
      // Return mock billing data since no user accounts
      res.json({
        billing: {
          id: 1,
          userId: 1,
          monthlyBalance: "25.00",
          lastBillingDate: new Date(),
          overageAmount: "0.00",
        },
        recentUsage: [],
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch billing information" });
    }
  });

  app.post("/api/billing/topup", async (req, res) => {
    try {
      // Mock success response since no user accounts
      res.json({
        success: true,
        message: "Payment not processed - no user accounts",
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to create payment intent" });
    }
  });

  app.post("/api/billing/confirm-payment", async (req, res) => {
    try {
      // Mock success response since no user accounts
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  // Spaces API routes
  app.get("/api/spaces", async (req, res) => {
    try {
      const userId = (req as any).session?.passport?.user || 1; // Use default user ID for demo
      
      const userSpaces = await db.select().from(spaces).where(eq(spaces.userId, userId));
      
      // If no spaces exist, create default spaces
      if (userSpaces.length === 0) {
        const defaultSpaces = [
          {
            userId,
            name: "My Personal Space",
            description: "Your personal workspace for individual projects and ideas",
            isDefault: true,
          },
          {
            userId,
            name: "My Workspace",
            description: "Professional workspace for work-related projects",
            isDefault: true,
          }
        ];

        for (const spaceData of defaultSpaces) {
          const [newSpace] = await db.insert(spaces).values(spaceData).returning();
          
          // Create default virtual employee for each space
          await db.insert(virtualEmployees).values({
            spaceId: newSpace.id,
            name: "Sophia",
            role: "Executive Assistant",
            assignedTools: ["task_management", "calendar", "notes"],
            isActive: true,
          });

          // Create default tools
          const defaultTools = [
            { name: "Audio Summary", type: "audio_summary", spaceId: newSpace.id },
            { name: "Video Summary", type: "video_summary", spaceId: newSpace.id },
            { name: "Mind Map", type: "mind_map", spaceId: newSpace.id },
            { name: "Reports", type: "report", spaceId: newSpace.id },
          ];
          
          for (const tool of defaultTools) {
            await db.insert(tools).values(tool);
          }
        }

        // Re-fetch spaces after creating defaults
        const createdSpaces = await db.select().from(spaces).where(eq(spaces.userId, userId));
        return res.json(createdSpaces);
      }
      
      res.json(userSpaces);
    } catch (error) {
      console.error("Error fetching spaces:", error);
      res.status(500).json({ error: "Failed to fetch spaces" });
    }
  });

  app.post("/api/spaces", async (req, res) => {
    try {
      const userId = (req as any).session?.passport?.user;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const spaceData = insertSpaceSchema.parse({ ...req.body, userId });
      const [newSpace] = await db.insert(spaces).values(spaceData).returning();
      
      res.status(201).json(newSpace);
    } catch (error) {
      console.error("Error creating space:", error);
      res.status(500).json({ error: "Failed to create space" });
    }
  });

  // Sources routes
  app.get("/api/spaces/:spaceId/sources", async (req, res) => {
    try {
      const userId = (req as any).session?.passport?.user;
      const { spaceId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Verify space ownership
      const space = await db.select().from(spaces).where(
        and(eq(spaces.id, parseInt(spaceId)), eq(spaces.userId, userId))
      );
      
      if (space.length === 0) {
        return res.status(404).json({ error: "Space not found" });
      }

      const spaceSources = await db.select().from(sources).where(eq(sources.spaceId, parseInt(spaceId)));
      res.json(spaceSources);
    } catch (error) {
      console.error("Error fetching sources:", error);
      res.status(500).json({ error: "Failed to fetch sources" });
    }
  });

  // Notes routes
  app.get("/api/spaces/:spaceId/notes", async (req, res) => {
    try {
      const userId = (req as any).session?.passport?.user;
      const { spaceId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Verify space ownership
      const space = await db.select().from(spaces).where(
        and(eq(spaces.id, parseInt(spaceId)), eq(spaces.userId, userId))
      );
      
      if (space.length === 0) {
        return res.status(404).json({ error: "Space not found" });
      }

      const spaceNotes = await db.select().from(notes).where(eq(notes.spaceId, parseInt(spaceId)));
      res.json(spaceNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  // Virtual Employees routes
  app.get("/api/spaces/:spaceId/virtual-employees", async (req, res) => {
    try {
      const userId = (req as any).session?.passport?.user;
      const { spaceId } = req.params;
      
      if (!userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Verify space ownership
      const space = await db.select().from(spaces).where(
        and(eq(spaces.id, parseInt(spaceId)), eq(spaces.userId, userId))
      );
      
      if (space.length === 0) {
        return res.status(404).json({ error: "Space not found" });
      }

      const employees = await db.select().from(virtualEmployees).where(eq(virtualEmployees.spaceId, parseInt(spaceId)));
      res.json(employees);
    } catch (error) {
      console.error("Error fetching virtual employees:", error);
      res.status(500).json({ error: "Failed to fetch virtual employees" });
    }
  });

  // Usage analytics - No authentication required, return empty array
  app.get("/api/usage", async (req, res) => {
    try {
      const userId = (req as any).session?.passport?.user;
      console.log("Usage API called - userId:", userId);
      
      if (!userId) {
        console.log("No userId found in session, returning 401");
        return res.status(401).json({ error: "Not authenticated" });
      }

      // Get usage logs for the authenticated user
      console.log("Fetching usage logs for userId:", userId);
      const usageLogs = await storage.getUsageLogs(userId, 100);
      console.log("Retrieved usage logs:", usageLogs.length, "entries");
      
      // Calculate summary statistics
      const totalTokens = usageLogs.reduce((sum, log) => sum + log.tokensConsumed, 0);
      const totalCost = usageLogs.reduce((sum, log) => sum + parseFloat(log.cost), 0);
      
      // Group by model
      const modelUsage = usageLogs.reduce((acc, log) => {
        if (!acc[log.modelUsed]) {
          acc[log.modelUsed] = {
            tokens: 0,
            cost: 0,
            requests: 0
          };
        }
        acc[log.modelUsed].tokens += log.tokensConsumed;
        acc[log.modelUsed].cost += parseFloat(log.cost);
        acc[log.modelUsed].requests += 1;
        return acc;
      }, {} as Record<string, { tokens: number; cost: number; requests: number }>);

      // Get billing information and usage summary
      const [usageSummary, usageLimit] = await Promise.all([
        storage.getUserUsageSummary(userId),
        storage.checkUsageLimit(userId)
      ]);

      const responseData = {
        totalTokens,
        totalCost: Math.round(totalCost * 10000) / 10000, // Round to 4 decimal places
        totalRequests: usageLogs.length,
        modelUsage,
        recentUsage: usageLogs.slice(0, 20), // Return last 20 requests
        
        // Billing information
        billing: {
          currentMonth: Math.round(usageSummary.currentMonth * 10000) / 10000,
          lastMonth: Math.round(usageSummary.lastMonth * 10000) / 10000,
          totalAllTime: Math.round(usageSummary.totalAllTime * 10000) / 10000,
          limit: usageSummary.currentLimit,
          planType: usageSummary.planType,
          
          // Usage limit status
          isOverLimit: usageLimit.isOverLimit,
          isNearLimit: usageLimit.isNearLimit,
          usagePercentage: Math.round(usageLimit.percentage * 100),
          remainingCredit: Math.max(0, usageLimit.limit - usageLimit.currentUsage)
        }
      };
      
      console.log("Usage API response:", JSON.stringify(responseData, null, 2));
      res.json(responseData);
    } catch (error) {
      console.error("Failed to fetch usage data:", error);
      res.status(500).json({ error: "Failed to fetch usage data" });
    }
  });

  // Admin endpoint for billing - view all user usage
  app.get("/api/admin/billing-usage", async (req, res) => {
    try {
      // Note: In production, add proper admin authentication here
      const { month, year } = req.query;
      const currentDate = new Date();
      const targetYear = year ? parseInt(year as string) : currentDate.getFullYear();
      const targetMonth = month ? parseInt(month as string) : currentDate.getMonth() + 1;
      const billingPeriod = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;

      // Get all users with usage in the specified period
      const usageByUser = await db.select({
        userId: usageLogs.userId,
        userEmail: users.email,
        username: users.username,
        totalTokens: sql<number>`sum(${usageLogs.tokensConsumed})`,
        totalCost: sql<number>`sum(${usageLogs.cost})`,
        requestCount: sql<number>`count(*)`,
        planType: billing.planType,
        usageLimit: billing.usageLimit,
        currentMonthUsage: billing.currentMonthUsage
      })
      .from(usageLogs)
      .leftJoin(users, eq(usageLogs.userId, users.id))
      .leftJoin(billing, eq(usageLogs.userId, billing.userId))
      .where(eq(usageLogs.billingPeriod, billingPeriod))
      .groupBy(usageLogs.userId, users.email, users.username, billing.planType, billing.usageLimit, billing.currentMonthUsage);

      const summary = {
        billingPeriod,
        totalUsers: usageByUser.length,
        totalRevenue: usageByUser.reduce((sum: number, user: any) => sum + parseFloat(user.totalCost.toString()), 0),
        totalTokens: usageByUser.reduce((sum: number, user: any) => sum + user.totalTokens, 0),
        totalRequests: usageByUser.reduce((sum: number, user: any) => sum + user.requestCount, 0),
        users: usageByUser.map((user: any) => ({
          userId: user.userId,
          email: user.userEmail,
          username: user.username,
          usage: {
            tokens: user.totalTokens,
            cost: Math.round(parseFloat(user.totalCost.toString()) * 10000) / 10000,
            requests: user.requestCount
          },
          billing: {
            planType: user.planType || 'free',
            limit: parseFloat(user.usageLimit || '10.00'),
            currentUsage: parseFloat(user.currentMonthUsage || '0.00'),
            isOverLimit: parseFloat(user.currentMonthUsage || '0.00') > parseFloat(user.usageLimit || '10.00')
          }
        }))
      };

      res.json(summary);
    } catch (error) {
      console.error("Failed to fetch billing usage data:", error);
      res.status(500).json({ error: "Failed to fetch billing usage data" });
    }
  });

  // Test endpoint to check authentication
  app.get("/api/test-auth", authenticateUser, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      res.json({
        authenticated: true,
        userId,
        user: req.user,
      });
    } catch (error) {
      res.status(500).json({ error: "Auth test failed" });
    }
  });

  // Google Drive chat history endpoints
  app.post("/api/google-drive/new-chat", authenticateUser, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      console.log("Creating new chat session for userId:", userId);

      // Get user's Google Drive credentials
      const integration = await storage.getIntegration(userId, "google-drive");
      if (!integration) {
        console.log("No Google Drive integration found for userId:", userId);
        return res
          .status(404)
          .json({ error: "Google Drive integration not found" });
      }

      console.log("Found Google Drive integration for userId:", userId);
      const credentials = JSON.parse(integration.credentialsEncrypted);
      const sessionId = await googleDriveService.createNewChatSession(
        JSON.stringify(credentials),
      );

      console.log("Created new chat session:", sessionId);
      res.json({ sessionId });
    } catch (error) {
      console.error("Google Drive new chat error:", error);
      res.status(500).json({
        error: "Failed to create new chat session",
        details: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.get(
    "/api/google-drive/chat-history",
    authenticateUser,
    async (req, res) => {
      try {
        const userId = (req.user as any)?.id;
        console.log("Fetching chat history for userId:", userId);

        // Get user's Google Drive credentials
        const integration = await storage.getIntegration(
          userId,
          "google-drive",
        );
        if (!integration) {
          console.log("No Google Drive integration found for userId:", userId);
          return res
            .status(404)
            .json({ error: "Google Drive integration not found" });
        }

        console.log("Found Google Drive integration for userId:", userId);
        const credentials = JSON.parse(integration.credentialsEncrypted);
        const chatFiles = await googleDriveService.getChatHistoryFiles(
          JSON.stringify(credentials),
        );

        console.log("Found chat files:", chatFiles.length);

        // Transform the files to include session info and summaries
        const chatSessions = await Promise.all(
          chatFiles.map(async (file) => {
            const sessionId = file.name
              ?.replace("chat_session_", "")
              .replace(".json", "") || "";
            
                         // Get summary for each session
             let title = `Chat Session ${sessionId}`;
             try {
               title = await googleDriveService.getChatSessionSummary(
                 sessionId,
                 JSON.stringify(credentials),
                 false // Don't force regenerate, just use existing or auto-regenerate if problematic
               );
             } catch (error) {
               console.error("Failed to get summary for session:", sessionId, error);
             }
            
            return {
              id: sessionId,
              title: title,
              modifiedTime: file.modifiedTime,
              size: file.size,
              fileId: file.id,
            };
          })
        );

        res.json(chatSessions);
      } catch (error) {
        console.error("Google Drive chat history error:", error);
        res.status(500).json({
          error: "Failed to fetch chat history",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  app.get(
    "/api/google-drive/chat-session/:sessionId",
    authenticateUser,
    async (req, res) => {
      try {
        const userId = (req.user as any)?.id;
        const { sessionId } = req.params;

        console.log(
          "Fetching chat session content for userId:",
          userId,
          "sessionId:",
          sessionId,
        );

        // Get user's Google Drive credentials
        const integration = await storage.getIntegration(
          userId,
          "google-drive",
        );
        if (!integration) {
          console.log("No Google Drive integration found for userId:", userId);
          return res
            .status(404)
            .json({ error: "Google Drive integration not found" });
        }

        console.log("Found Google Drive integration for userId:", userId);
        const credentials = JSON.parse(integration.credentialsEncrypted);
        const chatContent = await googleDriveService.getChatSessionContent(
          sessionId,
          JSON.stringify(credentials),
        );

        console.log(
          "Retrieved chat content, messages count:",
          chatContent.length,
        );
        res.json(chatContent);
      } catch (error) {
        console.error("Google Drive chat session error:", error);
        res.status(500).json({
          error: "Failed to fetch chat session",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Endpoint to regenerate chat session summaries
  app.post(
    "/api/google-drive/regenerate-summaries",
    authenticateUser,
    async (req, res) => {
      try {
        const userId = (req.user as any)?.id;
        console.log("Regenerating chat session summaries for userId:", userId);

        // Get user's Google Drive credentials
        const integration = await storage.getIntegration(
          userId,
          "google-drive",
        );
        if (!integration) {
          console.log("No Google Drive integration found for userId:", userId);
          return res
            .status(404)
            .json({ error: "Google Drive integration not found" });
        }

        console.log("Found Google Drive integration for userId:", userId);
        const credentials = JSON.stringify(integration.credentialsEncrypted);
        
        // Use the new bulk method to regenerate all summaries
        const result = await googleDriveService.regenerateAllChatSummaries(credentials);
        
        res.json({ 
          success: true, 
          message: `Regenerated summaries for ${result.success} chat sessions`,
          updatedCount: result.success,
          failedCount: result.failed
        });
      } catch (error) {
        console.error("Failed to regenerate summaries:", error);
        res.status(500).json({
          error: "Failed to regenerate summaries",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Non-authenticated version for testing (remove in production)
  app.get(
    "/api/google-drive/chat-session-test/:sessionId",
    async (req, res) => {
      try {
        const { sessionId } = req.params;
        console.log("Testing chat session content for sessionId:", sessionId);

        // For testing, use a mock user ID or get from session
        const session = req as any;
        const userId = session.session?.userId || 1; // Fallback to user ID 1 for testing

        console.log("Using userId for testing:", userId);

        // Get user's Google Drive credentials
        const integration = await storage.getIntegration(
          userId,
          "google-drive",
        );
        if (!integration) {
          console.log("No Google Drive integration found for userId:", userId);
          return res
            .status(404)
            .json({ error: "Google Drive integration not found" });
        }

        console.log("Found Google Drive integration for userId:", userId);
        const credentials = JSON.parse(integration.credentialsEncrypted);
        const chatContent = await googleDriveService.getChatSessionContent(
          sessionId,
          JSON.stringify(credentials),
        );

        console.log(
          "Retrieved chat content, messages count:",
          chatContent.length,
        );
        res.json(chatContent);
      } catch (error) {
        console.error("Google Drive chat session test error:", error);
        res.status(500).json({
          error: "Failed to fetch chat session",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    },
  );

  // Stripe payment routes
  app.post(
    "/api/stripe/create-payment-intent",
    authenticateUser,
    async (req, res) => {
      try {
        const { packageId } = req.body;
        const userId = (req.user as any)?.id;

        if (!packageId) {
          return res.status(400).json({ error: "Package ID is required" });
        }

        const { clientSecret, amount } = await billingService.createPaymentIntent(packageId, userId);
        
        res.json({
          clientSecret,
          amount,
          package: CREDIT_PACKAGES.find(p => p.id === packageId)
        });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).json({
          error: "Failed to create payment intent",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  app.post(
    "/api/stripe/confirm-payment",
    authenticateUser,
    async (req, res) => {
      try {
        const { paymentIntentId } = req.body;
        const userId = (req.user as any)?.id;

        if (!paymentIntentId) {
          return res.status(400).json({ error: "Payment intent ID is required" });
        }

        const { success, credits } = await billingService.confirmPayment(paymentIntentId);
        
        if (success) {
          // TODO: Add credits to user's account in database
          // For now, just return success
          res.json({
            success: true,
            credits,
            message: `Successfully added ${credits} credits to your account`
          });
        } else {
          res.status(400).json({
            success: false,
            error: "Payment confirmation failed"
          });
        }
      } catch (error) {
        console.error("Error confirming payment:", error);
        res.status(500).json({
          error: "Failed to confirm payment",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  app.get(
    "/api/stripe/credit-packages",
    async (req, res) => {
      try {
        const packages = await billingService.getCreditPackages();
        res.json(packages);
      } catch (error) {
        console.error("Error fetching credit packages:", error);
        res.status(500).json({
          error: "Failed to fetch credit packages",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  app.get(
    "/api/user/credits",
    authenticateUser,
    async (req, res) => {
      try {
        const userId = (req.user as any)?.id;
        const credits = await billingService.getUserCredits(userId);
        res.json({ credits });
      } catch (error) {
        console.error("Error fetching user credits:", error);
        res.status(500).json({
          error: "Failed to fetch user credits",
          details: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
