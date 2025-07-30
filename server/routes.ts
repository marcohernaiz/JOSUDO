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
import {
  insertChatSessionSchema,
  insertIntegrationSchema,
  insertUsageLogSchema,
} from "@shared/schema";
import { z } from "zod";

// Google OAuth will be configured dynamically or skipped for admin-only mode
const hasGoogleAuth =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

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
          req: Request,
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
      const { message, model } = req.body;

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

      // Route to appropriate AI service based on model
      try {
        switch (model) {
          case "deepseek-chat":
            serviceResponse = await deepseekService.sendMessage(message);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case "gpt-4":
          case "gpt-4o":
            // Fallback to DeepSeek since no user API keys
            serviceResponse = await openaiService.sendMessage(
              message,
              userId,
              userId,
              integration.credentialsEncrypted,
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
            serviceResponse = await claudeService.sendMessage(message);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case "gemini-pro":
            serviceResponse = await geminiService.sendMessage(message);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case "grok-beta":
            serviceResponse = await grokService.sendMessage(message);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          case "llama-3":
            serviceResponse = await llamaService.sendMessage(message);
            response = {
              choices: [{ message: { content: serviceResponse.response } }],
            };
            tokensUsed = serviceResponse.tokens;
            cost = serviceResponse.cost;
            break;

          default:
            // Default to DeepSeek for any unknown model
            serviceResponse = await deepseekService.sendMessage(message);
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
        serviceResponse = await deepseekService.sendMessage(message);
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
        // Save both user and AI message
        await googleDriveService.saveChatMessage(
          userId, // or sessionId if you have one
          message, // user message (string)
          response.choices[0].message.content || "", // ai response (string)
          JSON.stringify(credentials), // credentials (string)
        );
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

        // Transform the files to include session info
        const chatSessions = chatFiles.map((file) => {
          const sessionId = file.name
            ?.replace("chat_session_", "")
            .replace(".json", "");
          return {
            id: sessionId,
            title: `Chat Session ${sessionId}`,
            modifiedTime: file.modifiedTime,
            size: file.size,
            fileId: file.id,
          };
        });

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
