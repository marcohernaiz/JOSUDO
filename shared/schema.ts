import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
  json,
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

export const usageLogs = pgTable("usage_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  chatSessionId: integer("chat_session_id").references(() => chatSessions.id),
  modelUsed: text("model_used").notNull(),
  tokensConsumed: integer("tokens_consumed").notNull(),
  cost: decimal("cost", { precision: 10, scale: 4 }).notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  isPremiumAccount: boolean("is_premium_account").default(false),
  billingPeriod: text("billing_period"), // e.g., "2024-01" for monthly billing
  requestType: text("request_type").default("chat"), // "chat", "api", "batch"
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

// Spaces tables
export const spaces = pgTable("spaces", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  coverImage: text("cover_image"),
  iconType: text("icon_type").default("default"), // default, custom
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id")
    .references(() => spaces.id)
    .notNull(),
  title: text("title").notNull(),
  type: text("type").notNull(), // "pdf", "website", "text", "video", "audio", "google-drive"
  content: text("content"),
  fileUrl: text("file_url"),
  metadata: json("metadata"),
  isInKnowledgeBase: boolean("is_in_knowledge_base").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id")
    .references(() => spaces.id)
    .notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isInKnowledgeBase: boolean("is_in_knowledge_base").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id")
    .references(() => spaces.id)
    .notNull(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").default("pending"), // "pending", "in_progress", "completed"
  priority: text("priority").default("medium"), // "low", "medium", "high"
  assignedToEmployeeId: integer("assigned_to_employee_id"),
  createdByTool: text("created_by_tool"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tools = pgTable("tools", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id")
    .references(() => spaces.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // "audio_summary", "video_summary", "mind_map", "report", "custom"
  configuration: json("configuration"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const virtualEmployees = pgTable("virtual_employees", {
  id: serial("id").primaryKey(),
  spaceId: integer("space_id")
    .references(() => spaces.id)
    .notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar"),
  assignedTools: text("assigned_tools").array(),
  configuration: json("configuration"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const digitalPersonas = pgTable("digital_personas", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  avatar: text("avatar"),
  voiceId: text("voice_id"),
  greeting: text("greeting"),
  systemPrompt: text("system_prompt"),
  behaviorText: text("behavior_text"),
  capabilitiesText: text("capabilities_text"),
  contextualText: text("contextual_text"),
  guardrailsText: text("guardrails_text"),
  multimodalConfig: json("multimodal_config"), // stores web chat, audio, video, phone, etc.
  resourcesConfig: json("resources_config"), // stores own resources and connected resources
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const personaTemplates = pgTable("persona_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  category: text("category").notNull(), // 'virtual_employees', 'industry_experts', 'personal_companion'
  avatar: text("avatar"),
  voiceId: text("voice_id"),
  greeting: text("greeting"),
  systemPrompt: text("system_prompt"),
  behaviorText: text("behavior_text"),
  capabilitiesText: text("capabilities_text"),
  contextualText: text("contextual_text"),
  guardrailsText: text("guardrails_text"),
  multimodalConfig: json("multimodal_config"),
  resourcesConfig: json("resources_config"),
  skills: text("skills").array(), // Array of skills like ['email', 'calendar', 'CRM']
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const integrationsRelations = relations(integrations, ({ one }) => ({
  user: one(users, {
    fields: [integrations.userId],
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

// Spaces relations
export const spacesRelations = relations(spaces, ({ one, many }) => ({
  user: one(users, {
    fields: [spaces.userId],
    references: [users.id],
  }),
  sources: many(sources),
  notes: many(notes),
  tasks: many(tasks),
  tools: many(tools),
  virtualEmployees: many(virtualEmployees),
}));

export const sourcesRelations = relations(sources, ({ one }) => ({
  space: one(spaces, {
    fields: [sources.spaceId],
    references: [spaces.id],
  }),
}));

export const notesRelations = relations(notes, ({ one }) => ({
  space: one(spaces, {
    fields: [notes.spaceId],
    references: [spaces.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  space: one(spaces, {
    fields: [tasks.spaceId],
    references: [spaces.id],
  }),
}));

export const toolsRelations = relations(tools, ({ one }) => ({
  space: one(spaces, {
    fields: [tools.spaceId],
    references: [spaces.id],
  }),
}));

export const virtualEmployeesRelations = relations(virtualEmployees, ({ one }) => ({
  space: one(spaces, {
    fields: [virtualEmployees.spaceId],
    references: [spaces.id],
  }),
}));

export const digitalPersonasRelations = relations(digitalPersonas, ({ one }) => ({
  user: one(users, {
    fields: [digitalPersonas.userId],
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

// Spaces insert schemas
export const insertSpaceSchema = createInsertSchema(spaces).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSourceSchema = createInsertSchema(sources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertNoteSchema = createInsertSchema(notes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertToolSchema = createInsertSchema(tools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVirtualEmployeeSchema = createInsertSchema(virtualEmployees).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDigitalPersonaSchema = createInsertSchema(digitalPersonas).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPersonaTemplateSchema = createInsertSchema(personaTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

// Spaces types
export type Space = typeof spaces.$inferSelect;
export type InsertSpace = z.infer<typeof insertSpaceSchema>;
export type Source = typeof sources.$inferSelect;
export type InsertSource = z.infer<typeof insertSourceSchema>;
export type Note = typeof notes.$inferSelect;
export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Tool = typeof tools.$inferSelect;
export type InsertTool = z.infer<typeof insertToolSchema>;
export type VirtualEmployee = typeof virtualEmployees.$inferSelect;
export type InsertVirtualEmployee = z.infer<typeof insertVirtualEmployeeSchema>;
export type DigitalPersona = typeof digitalPersonas.$inferSelect;
export type InsertDigitalPersona = z.infer<typeof insertDigitalPersonaSchema>;
export type PersonaTemplate = typeof personaTemplates.$inferSelect;
export type InsertPersonaTemplate = z.infer<typeof insertPersonaTemplateSchema>;
