import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
  json,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  googleId: text("google_id").unique(),
  appleId: text("apple_id").unique(),
  microsoftId: text("microsoft_id").unique(),
  email: text("email").notNull().unique(),
  username: text("username").notNull(),
  avatar: text("avatar"),
  credits: integer("credits").default(0), // AI credits balance
  createdAt: timestamp("created_at").defaultNow(),
  subscriptionStatus: text("subscription_status").default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

// New table for credit transactions
export const creditTransactions = pgTable("credit_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  type: text("type").notNull(), // 'purchase', 'usage', 'refund', 'bonus', 'expiry'
  amount: integer("amount").notNull(), // positive for credits added, negative for credits used
  balanceBefore: integer("balance_before").notNull(),
  balanceAfter: integer("balance_after").notNull(),
  description: text("description"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  metadata: json("metadata"), // Additional data like package details, usage details
  expiresAt: timestamp("expires_at"), // For credits with expiration
  createdAt: timestamp("created_at").defaultNow(),
});

// New table for credit packages
export const creditPackages = pgTable("credit_packages", {
  id: text("id").primaryKey(), // 'basic', 'premium'
  name: text("name").notNull(),
  credits: integer("credits").notNull(),
  price: integer("price").notNull(), // Price in cents
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  serviceType: text("service_type").notNull(), // 'ai_model' or 'storage'
  serviceName: text("service_name").notNull(), // 'openai', 'claude', 'google_drive', etc.
  credentialsEncrypted: text("credentials_encrypted").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  title: text("title").notNull(),
  modelUsed: text("model_used").notNull(),
  storageLocation: text("storage_location"), // external storage path
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Enhanced usage logs with better tracking
export const usageLogs = pgTable("usage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  chatSessionId: integer("chat_session_id").references(() => chatSessions.id),
  modelUsed: text("model_used").notNull(),
  tokensConsumed: integer("tokens_consumed").notNull(),
  creditsDeducted: integer("credits_deducted").notNull(), // Credits actually deducted
  cost: decimal("cost", { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isPremiumAccount: boolean("is_premium_account").default(false),
  billingPeriod: text("billing_period"), // e.g., "2024-01" for monthly billing
  requestType: text("request_type").default("chat"), // "chat", "api", "batch"
  status: text("status").default("completed"), // "completed", "failed", "cancelled"
  errorMessage: text("error_message"),
  metadata: json("metadata"), // Additional usage data
});

export const billing = pgTable("billing", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  monthlyBalance: decimal("monthly_balance", {
    precision: 10,
    scale: 2,
  }).default("9.99"),
  lastBillingDate: timestamp("last_billing_date").defaultNow(),
  overageAmount: decimal("overage_amount", { precision: 10, scale: 2 }).default(
    "0.00",
  ),
  currentMonthUsage: decimal("current_month_usage", {
    precision: 10,
    scale: 4,
  }).default("0.0000"),
  usageLimit: decimal("usage_limit", { precision: 10, scale: 2 }).default(
    "10.00",
  ), // Monthly limit
  alertThreshold: decimal("alert_threshold", {
    precision: 3,
    scale: 2,
  }).default("0.80"), // 80% alert
  isActive: boolean("is_active").default(true),
  planType: text("plan_type").default("free"), // "free", "basic", "premium"
});

export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  isEncrypted: boolean("is_encrypted").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
}));

export const creditTransactionsRelations = relations(creditTransactions, ({ one }) => ({
  user: one(users, {
    fields: [creditTransactions.userId],
    references: [users.id],
  }),
}));

export const chatSessionsRelations = relations(
  chatSessions,
  ({ one, many }) => ({
    user: one(users, {
      fields: [chatSessions.userId],
      references: [users.id],
    }),
    usageLogs: many(usageLogs),
  }),
);

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  user: one(users, {
    fields: [usageLogs.userId],
    references: [users.id],
  }),
  chatSession: one(chatSessions, {
    fields: [usageLogs.chatSessionId],
    references: [chatSessions.id],
  }),
}));

export const billingRelations = relations(billing, ({ one }) => ({
  user: one(users, {
    fields: [billing.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCreditTransactionSchema = createInsertSchema(creditTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertCreditPackageSchema = createInsertSchema(creditPackages).omit({
  createdAt: true,
});

export const insertIntegrationSchema = createInsertSchema(integrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUsageLogSchema = createInsertSchema(usageLogs).omit({
  id: true,
  timestamp: true,
});

export const insertBillingSchema = createInsertSchema(billing).omit({
  id: true,
  lastBillingDate: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type InsertCreditTransaction = z.infer<typeof insertCreditTransactionSchema>;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type InsertCreditPackage = z.infer<typeof insertCreditPackageSchema>;
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
export type Billing = typeof billing.$inferSelect;
export type InsertBilling = z.infer<typeof insertBillingSchema>;
