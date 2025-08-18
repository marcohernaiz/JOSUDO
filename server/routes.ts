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
import { billingService } from "./services/billing";
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
} from "@shared/schema";
import { z } from "zod";

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

    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          callbackURL:
            "https://8fdbab7c-95d5-4874-bfbd-1fd1ebf7f828-00-nad6e6v3p5fi.picard.replit.dev/api/auth/google/callback",
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
            break;

          case "claude-3-5-sonnet":
            serviceResponse = await claudeService.sendMessage(message, model, conversationHistory);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case "gemini-pro":
            serviceResponse = await geminiService.sendMessage(message, model, conversationHistory);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case "grok-beta":
            serviceResponse = await grokService.sendMessage(message, model, conversationHistory);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case "llama-3":
            serviceResponse = await llamaService.sendMessage(message, model, conversationHistory);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case "llama-3.1-8b":
          case "gpt-5":
            // Use Replicate with proper sessionId for context
            serviceResponse = await replicateService.sendMessage(
              message,
              userId,
              sessionId || userId.toString(),
              integration?.credentialsEncrypted || "",
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
                content: `[Fallback to DeepSeek - ${model} unavailable]\n\n${serviceResponse.response}`,
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
      const { message, model, sessionId } = req.body;
      console.log("Received streaming chat request:", { message, model, sessionId });

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

      let totalTokens = 0;
      let fullResponse = "";

      try {
        console.log("Starting streaming for model:", model);
        // Route to appropriate AI service for streaming
        switch (model) {
          case "deepseek-chat":
          case "deepseek-r1":
            console.log("Starting DeepSeek streaming...");
            for await (const chunk of deepseekService.sendMessageStream(message, model, conversationHistory)) {
              console.log("Received chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("DeepSeek streaming finished, fullResponse length:", fullResponse.length);
            break;

          case "gpt-4":
          case "gpt-4o":
            if (userId && integration) {
              for await (const chunk of openaiService.sendMessageStream(
                message,
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
              for await (const chunk of deepseekService.sendMessageStream(message, "deepseek-chat", conversationHistory)) {
                fullResponse += chunk.content;
                res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
              }
            }
            break;

          case "claude-3-5-sonnet":
            console.log("Starting Claude streaming...");
            for await (const chunk of claudeService.sendMessageStream(message, model, conversationHistory)) {
              console.log("Received Claude chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Claude streaming finished, fullResponse length:", fullResponse.length);
            break;

          case "gemini-pro":
            console.log("Starting Gemini streaming...");
            for await (const chunk of geminiService.sendMessageStream(message, model, conversationHistory)) {
              console.log("Received Gemini chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Gemini streaming finished, fullResponse length:", fullResponse.length);
            break;

          case "grok-beta":
            console.log("Starting Grok streaming...");
            for await (const chunk of grokService.sendMessageStream(message, model, conversationHistory)) {
              console.log("Received Grok chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Grok streaming finished, fullResponse length:", fullResponse.length);
            break;

          case "llama-3":
            console.log("Starting Llama streaming...");
            for await (const chunk of llamaService.sendMessageStream(message, model, conversationHistory)) {
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
            if (userId && integration) {
              for await (const chunk of replicateService.sendMessageStream(
                message,
                userId,
                sessionId || userId.toString(),
                integration?.credentialsEncrypted || "",
                model,
              )) {
                console.log("Received Replicate chunk:", chunk.content);
                fullResponse += chunk.content;
                res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
              }
            } else {
              console.log("User not authenticated, falling back to DeepSeek for model:", model);
              // Fallback to DeepSeek for unauthenticated users
              for await (const chunk of deepseekService.sendMessageStream(message, "deepseek-chat", conversationHistory)) {
                console.log("Received fallback chunk:", chunk.content);
                fullResponse += chunk.content;
                res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
              }
            }
            console.log("Replicate streaming finished, fullResponse length:", fullResponse.length);
            break;

          default:
            console.log("Unknown model, defaulting to DeepSeek:", model);
            // Default to DeepSeek for any unknown model
            for await (const chunk of deepseekService.sendMessageStream(message, "deepseek-chat", conversationHistory)) {
              console.log("Received default chunk:", chunk.content);
              fullResponse += chunk.content;
              res.write(`data: ${JSON.stringify({ content: chunk.content, type: 'chunk' })}\n\n`);
            }
            console.log("Default streaming finished, fullResponse length:", fullResponse.length);
            break;
        }

        console.log("Streaming completed, full response length:", fullResponse.length);
        // Send completion signal
        res.write(`data: ${JSON.stringify({ 
          type: 'complete', 
          response: fullResponse,
          tokens: totalTokens || Math.floor(fullResponse.length / 4),
          model: model
        })}\n\n`);

        // Save the complete conversation to Google Drive (only if authenticated)
        if (integration && userId) {
          try {
            await googleDriveService.saveChatMessage(
              sessionId || userId.toString(),
              message,
              fullResponse,
              integration.credentialsEncrypted
            );
          } catch (error) {
            console.error("Failed to save message to Google Drive:", error);
          }
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

  // Usage analytics - No authentication required, return empty array
  app.get("/api/usage", async (req, res) => {
    try {
      // Return empty array since no user accounts
      res.json([]);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch usage data" });
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
                JSON.stringify(credentials)
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

  const httpServer = createServer(app);
  return httpServer;
}
