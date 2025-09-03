import Stripe from 'stripe';
import { db } from '../db';
import { users, creditTransactions, usageLogs, creditPackages } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number; // in cents
  description: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'basic',
    name: 'Basic Package',
    credits: 1000,
    price: 1000, // $10.00
    description: '1,000 AI credits for basic usage',
  },
  {
    id: 'premium',
    name: 'Premium Package',
    credits: 2500,
    price: 2500, // $25.00
    description: '2,500 AI credits for power users',
  },
];

export class BillingService {
  /**
   * Create a payment intent for credit purchase
   */
  async createPaymentIntent(packageId: string, userId: number) {
    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      throw new Error('Invalid package ID');
    }

    // Get user info
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      throw new Error('User not found');
    }

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.price,
      currency: 'usd',
      metadata: {
        userId: userId.toString(),
        packageId: packageId,
        credits: pkg.credits.toString(),
      },
    });

    return {
      clientSecret: paymentIntent.client_secret,
      amount: pkg.price,
      package: pkg,
    };
  }

  /**
   * Confirm payment and add credits to user account
   */
  async confirmPayment(paymentIntentId: string, userId: number) {
    // Verify payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error('Payment not completed');
    }

    const { packageId, credits } = paymentIntent.metadata;
    const creditsToAdd = parseInt(credits);

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Get current user balance
      const currentUser = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!currentUser.length) {
        throw new Error('User not found');
      }

      const balanceBefore = currentUser[0].credits || 0;
      const balanceAfter = balanceBefore + creditsToAdd;

      // Update user credits
      await tx.update(users)
        .set({ credits: balanceAfter })
        .where(eq(users.id, userId));

      // Log credit transaction
      await tx.insert(creditTransactions).values({
        userId,
        type: 'purchase',
        amount: creditsToAdd,
        balanceBefore,
        balanceAfter,
        description: `Purchased ${creditsToAdd} credits via Stripe`,
        stripePaymentIntentId: paymentIntentId,
        metadata: {
          packageId,
          stripeAmount: paymentIntent.amount,
          stripeCurrency: paymentIntent.currency,
        },
      });

      return { credits: creditsToAdd, newBalance: balanceAfter };
    });

    return result;
  }

  /**
   * Deduct credits for AI usage
   */
  async deductCredits(userId: number, tokensConsumed: number, modelUsed: string, chatSessionId?: number) {
    // Calculate credits to deduct based on cost (1 credit = $0.01)
    // We need to calculate the actual cost first, then convert to credits
    let cost = 0;
    
    // Calculate cost based on model (same logic as in routes)
    if (modelUsed === "gpt-5") {
      cost = (tokensConsumed / 1000) * 0.002; // $0.002 per 1K tokens
    } else if (modelUsed === "deepseek-v3") {
      cost = (tokensConsumed / 1000) * 0.0002; // $0.0002 per 1K tokens
    } else if (modelUsed === "claude-3-5-sonnet-replicate") {
      cost = (tokensConsumed / 1000) * 0.003; // $0.003 per 1K tokens
    } else if (modelUsed === "claude-3-haiku-replicate") {
      cost = (tokensConsumed / 1000) * 0.00025; // $0.00025 per 1K tokens
    } else {
      cost = (tokensConsumed / 1000) * 0.0002; // Default rate
    }
    
    const creditsToDeduct = Math.ceil(cost * 100); // Convert cost to credits (1 credit = $0.01)
    
    const result = await db.transaction(async (tx) => {
      // Get current user balance
      const currentUser = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!currentUser.length) {
        throw new Error('User not found');
      }

      const balanceBefore = currentUser[0].credits || 0;
      
      if (balanceBefore < creditsToDeduct) {
        throw new Error('Insufficient credits');
      }

      const balanceAfter = balanceBefore - creditsToDeduct;

      // Update user credits
      await tx.update(users)
        .set({ credits: balanceAfter })
        .where(eq(users.id, userId));

      // Log credit transaction
      await tx.insert(creditTransactions).values({
        userId,
        type: 'usage',
        amount: -creditsToDeduct, // Negative for usage
        balanceBefore,
        balanceAfter,
        description: `Used ${creditsToDeduct} credits for AI model: ${modelUsed}`,
        metadata: {
          modelUsed,
          tokensConsumed,
          chatSessionId,
        },
      });

      // Log usage
      await tx.insert(usageLogs).values({
        userId,
        chatSessionId: chatSessionId || null,
        modelUsed,
        tokensConsumed,
        creditsDeducted: creditsToDeduct,
        cost: cost.toString(), // Use the calculated cost
        status: 'completed',
        metadata: {
          balanceBefore,
          balanceAfter,
        },
      });

      return { creditsDeducted: creditsToDeduct, newBalance: balanceAfter };
    });

    return result;
  }

  /**
   * Get user's current credit balance
   */
  async getUserCredits(userId: number) {
    const user = await db.select({ credits: users.credits }).from(users).where(eq(users.id, userId)).limit(1);
    return user[0]?.credits || 0;
  }

  /**
   * Get user's credit transaction history
   */
  async getCreditTransactions(userId: number, limit = 50, offset = 0) {
    const transactions = await db.select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(limit)
      .offset(offset);

    return transactions;
  }

  /**
   * Get user's usage history
   */
  async getUsageHistory(userId: number, startDate?: Date, endDate?: Date, limit = 100) {
    let conditions = [eq(usageLogs.userId, userId)];
    
    if (startDate && endDate) {
      conditions.push(
        gte(usageLogs.timestamp, startDate),
        lte(usageLogs.timestamp, endDate)
      );
    }

    const usage = await db.select()
      .from(usageLogs)
      .where(and(...conditions))
      .orderBy(desc(usageLogs.timestamp))
      .limit(limit);

    return usage;
  }

  /**
   * Get usage statistics for current month
   */
  async getCurrentMonthUsage(userId: number) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const usage = await db.select({
      totalTokens: sql<number>`SUM(${usageLogs.tokensConsumed})`,
      totalCredits: sql<number>`SUM(${usageLogs.creditsDeducted})`,
      totalRequests: sql<number>`COUNT(*)`,
    })
    .from(usageLogs)
    .where(
      and(
        eq(usageLogs.userId, userId),
        gte(usageLogs.timestamp, startOfMonth),
        lte(usageLogs.timestamp, endOfMonth),
        eq(usageLogs.status, 'completed')
      )
    );

    return {
      totalTokens: usage[0]?.totalTokens || 0,
      totalCredits: usage[0]?.totalCredits || 0,
      totalRequests: usage[0]?.totalRequests || 0,
      period: {
        start: startOfMonth,
        end: endOfMonth,
      },
    };
  }

  /**
   * Get credit packages
   */
  async getCreditPackages() {
    return CREDIT_PACKAGES;
  }

  /**
   * Check if user has sufficient credits
   */
  async hasSufficientCredits(userId: number, requiredCredits: number) {
    const balance = await this.getUserCredits(userId);
    return balance >= requiredCredits;
  }

  /**
   * Get user's credit summary
   */
  async getCreditSummary(userId: number) {
    const [currentBalance, currentMonthUsage, recentTransactions] = await Promise.all([
      this.getUserCredits(userId),
      this.getCurrentMonthUsage(userId),
      this.getCreditTransactions(userId, 5, 0), // Last 5 transactions
    ]);

    return {
      currentBalance,
      currentMonthUsage,
      recentTransactions,
    };
  }
}

export const billingService = new BillingService();
