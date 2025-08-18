import { 
  users, 
  integrations, 
  chatSessions, 
  usageLogs, 
  billing,
  type User, 
  type InsertUser,
  type Integration,
  type InsertIntegration,
  type ChatSession,
  type InsertChatSession,
  type UsageLog,
  type InsertUsageLog,
  type Billing,
  type InsertBilling
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  getUserByAppleId(appleId: string): Promise<User | undefined>;
  getUserByMicrosoftId(microsoftId: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  
  // Integration operations
  getIntegrations(userId: number): Promise<Integration[]>;
  getIntegration(userId: number, serviceName: string): Promise<Integration | undefined>;
  createIntegration(integration: InsertIntegration): Promise<Integration>;
  updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration>;
  deleteIntegration(id: number): Promise<void>;
  
  // Chat session operations
  getChatSessions(userId: number): Promise<ChatSession[]>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession>;
  deleteChatSession(id: number): Promise<void>;
  
  // Usage log operations
  createUsageLog(log: InsertUsageLog): Promise<UsageLog>;
  getUsageLogs(userId: number, limit?: number): Promise<UsageLog[]>;
  
  // Billing operations
  getBilling(userId: number): Promise<Billing | undefined>;
  createBilling(billing: InsertBilling): Promise<Billing>;
  updateBilling(userId: number, updates: Partial<Billing>): Promise<Billing>;
  deductBalance(userId: number, amount: string): Promise<void>;
  addBalance(userId: number, amount: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.googleId, googleId));
    return user || undefined;
  }

  async getUserByAppleId(appleId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.appleId, appleId));
    return user || undefined;
  }

  async getUserByMicrosoftId(microsoftId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.microsoftId, microsoftId));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
    return user;
  }

  async getIntegrations(userId: number): Promise<Integration[]> {
    return await db.select().from(integrations).where(eq(integrations.userId, userId));
  }

  async getIntegration(userId: number, serviceName: string): Promise<Integration | undefined> {
    const [integration] = await db.select().from(integrations)
      .where(and(eq(integrations.userId, userId), eq(integrations.serviceName, serviceName)));
    return integration || undefined;
  }

  async createIntegration(integration: InsertIntegration): Promise<Integration> {
    const [created] = await db.insert(integrations).values(integration).returning();
    return created;
  }

  async updateIntegration(id: number, updates: Partial<Integration>): Promise<Integration> {
    const [updated] = await db.update(integrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(integrations.id, id))
      .returning();
    return updated;
  }

  async deleteIntegration(id: number): Promise<void> {
    await db.delete(integrations).where(eq(integrations.id, id));
  }

  async getChatSessions(userId: number): Promise<ChatSession[]> {
    return await db.select().from(chatSessions)
      .where(eq(chatSessions.userId, userId))
      .orderBy(desc(chatSessions.updatedAt));
  }

  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session || undefined;
  }

  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const [created] = await db.insert(chatSessions).values(session).returning();
    return created;
  }

  async updateChatSession(id: number, updates: Partial<ChatSession>): Promise<ChatSession> {
    const [updated] = await db.update(chatSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(chatSessions.id, id))
      .returning();
    return updated;
  }

  async deleteChatSession(id: number): Promise<void> {
    await db.delete(chatSessions).where(eq(chatSessions.id, id));
  }

  async createUsageLog(log: InsertUsageLog): Promise<UsageLog> {
    const [created] = await db.insert(usageLogs).values(log).returning();
    return created;
  }

  async getUsageLogs(userId: number, limit: number = 100): Promise<UsageLog[]> {
    return await db.select().from(usageLogs)
      .where(eq(usageLogs.userId, userId))
      .orderBy(desc(usageLogs.timestamp))
      .limit(limit);
  }

  async getBilling(userId: number): Promise<Billing | undefined> {
    const [userBilling] = await db.select().from(billing).where(eq(billing.userId, userId));
    return userBilling || undefined;
  }

  async createBilling(billingData: InsertBilling): Promise<Billing> {
    const [createdBilling] = await db.insert(billing).values(billingData).returning();
    return createdBilling;
  }

  async updateBilling(userId: number, updates: Partial<Billing>): Promise<Billing> {
    const [updatedBilling] = await db.update(billing)
      .set(updates)
      .where(eq(billing.userId, userId))
      .returning();
    return updatedBilling;
  }

  async deductBalance(userId: number, amount: string): Promise<void> {
    await db.update(billing)
      .set({ 
        monthlyBalance: sql`monthly_balance - ${amount}`
      })
      .where(eq(billing.userId, userId));
  }

  async addBalance(userId: number, amount: string): Promise<void> {
    await db.update(billing)
      .set({ 
        monthlyBalance: sql`monthly_balance + ${amount}`
      })
      .where(eq(billing.userId, userId));
  }

  // Enhanced billing functions for usage tracking
  async updateMonthlyUsage(userId: number, additionalCost: number): Promise<void> {
    await db.update(billing)
      .set({ 
        currentMonthUsage: sql`current_month_usage + ${additionalCost.toString()}`
      })
      .where(eq(billing.userId, userId));
  }

  async getMonthlyUsage(userId: number, year: number, month: number): Promise<number> {
    const billingPeriod = `${year}-${month.toString().padStart(2, '0')}`;
    const logs = await db.select({ cost: usageLogs.cost })
      .from(usageLogs)
      .where(
        and(
          eq(usageLogs.userId, userId),
          eq(usageLogs.billingPeriod, billingPeriod)
        )
      );
    
    return logs.reduce((total, log) => total + parseFloat(log.cost), 0);
  }

  async getUserUsageSummary(userId: number): Promise<{
    currentMonth: number;
    lastMonth: number;
    totalAllTime: number;
    currentLimit: number;
    planType: string;
  }> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const lastYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const [currentMonthUsage, lastMonthUsage, totalUsage, userBilling] = await Promise.all([
      this.getMonthlyUsage(userId, currentYear, currentMonth),
      this.getMonthlyUsage(userId, lastYear, lastMonth),
      db.select({ cost: usageLogs.cost })
        .from(usageLogs)
        .where(eq(usageLogs.userId, userId)),
      this.getBilling(userId)
    ]);

    const totalAllTime = totalUsage.reduce((total, log) => total + parseFloat(log.cost), 0);

    return {
      currentMonth: currentMonthUsage,
      lastMonth: lastMonthUsage,
      totalAllTime,
      currentLimit: parseFloat(userBilling?.usageLimit || "10.00"),
      planType: userBilling?.planType || "free"
    };
  }

  async checkUsageLimit(userId: number): Promise<{
    isOverLimit: boolean;
    isNearLimit: boolean;
    currentUsage: number;
    limit: number;
    percentage: number;
  }> {
    const userBilling = await this.getBilling(userId);
    if (!userBilling) {
      return { isOverLimit: false, isNearLimit: false, currentUsage: 0, limit: 10, percentage: 0 };
    }

    const currentUsage = parseFloat(userBilling.currentMonthUsage || "0");
    const limit = parseFloat(userBilling.usageLimit || "10.00");
    const alertThreshold = parseFloat(userBilling.alertThreshold || "0.80");
    const percentage = limit > 0 ? currentUsage / limit : 0;

    return {
      isOverLimit: currentUsage > limit,
      isNearLimit: percentage >= alertThreshold,
      currentUsage,
      limit,
      percentage: Math.round(percentage * 100) / 100
    };
  }
}

export const storage = new DatabaseStorage();
