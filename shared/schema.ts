import { pgTable, text, serial, integer, boolean, timestamp, decimal, json } from "drizzle-orm/pg-core";
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
  createdAt: timestamp("created_at").defaultNow(),
  subscriptionStatus: text("subscription_status").default("active"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const integrations = pgTable("integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  serviceType: text("service_type").notNull(), // 'ai_model' or 'storage'
  serviceName: text("service_name").notNull(), // 'openai', 'claude', 'google_drive', etc.
  credentialsEncrypted: text("credentials_encrypted").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  modelUsed: text("model_used").notNull(),
  storageLocation: text("storage_location"), // external storage path
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usageLogs = pgTable("usage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  chatSessionId: integer("chat_session_id").references(() => chatSessions.id),
  modelUsed: text("model_used").notNull(),
  tokensConsumed: integer("tokens_consumed").notNull(),
  cost: decimal("cost", { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isPremiumAccount: boolean("is_premium_account").default(false),
});

export const billing = pgTable("billing", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  monthlyBalance: decimal("monthly_balance", { precision: 10, scale: 2 }).default("9.99"),
  lastBillingDate: timestamp("last_billing_date").defaultNow(),
  overageAmount: decimal("overage_amount", { precision: 10, scale: 2 }).default("0.00"),
});

export const virtualEmployees = pgTable("virtual_employees", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  personaId: text("persona_id").notNull(), // 'closer', 'connector', etc.
  name: text("name").notNull(),
  customization: json("customization").notNull(), // task focus, work style, hours
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastInteraction: timestamp("last_interaction").defaultNow(),
});

export const employeeTasks = pgTable("employee_tasks", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => virtualEmployees.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // 'pending', 'in_progress', 'completed', 'cancelled'
  priority: text("priority").default("medium"), // 'low', 'medium', 'high', 'urgent'
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const employeeContext = pgTable("employee_context", {
  id: serial("id").primaryKey(),
  employeeId: integer("employee_id").references(() => virtualEmployees.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  contextType: text("context_type").notNull(), // 'company_info', 'user_preferences', 'conversation_memory'
  contextData: json("context_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const virtualEmployeesRelations = relations(virtualEmployees, ({ one, many }) => ({
  user: one(users, {
    fields: [virtualEmployees.userId],
    references: [users.id],
  }),
  tasks: many(employeeTasks),
  context: many(employeeContext),
}));

export const employeeTasksRelations = relations(employeeTasks, ({ one }) => ({
  employee: one(virtualEmployees, {
    fields: [employeeTasks.employeeId],
    references: [virtualEmployees.id],
  }),
  user: one(users, {
    fields: [employeeTasks.userId],
    references: [users.id],
  }),
}));

export const employeeContextRelations = relations(employeeContext, ({ one }) => ({
  employee: one(virtualEmployees, {
    fields: [employeeContext.employeeId],
    references: [virtualEmployees.id],
  }),
  user: one(users, {
    fields: [employeeContext.userId],
    references: [users.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  integrations: many(integrations),
  chatSessions: many(chatSessions),
  usageLogs: many(usageLogs),
  billing: many(billing),
  virtualEmployees: many(virtualEmployees),
}));

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
    references: [users.id],
  }),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [chatSessions.userId],
    references: [users.id],
  }),
  usageLogs: many(usageLogs),
}));

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
export type Integration = typeof integrations.$inferSelect;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;
export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type UsageLog = typeof usageLogs.$inferSelect;
export type InsertUsageLog = z.infer<typeof insertUsageLogSchema>;
export type Billing = typeof billing.$inferSelect;
export type InsertBilling = z.infer<typeof insertBillingSchema>;
