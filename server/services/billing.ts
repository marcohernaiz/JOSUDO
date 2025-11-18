import Stripe from 'stripe';
import { db } from '../db';
import { users, creditTransactions, usageLogs, creditPackages } from '../../shared/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not found. Payment functionality will be disabled.');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-07-30.basil',
}) : null;

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
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) {
      throw new Error('Invalid package ID');
    }

    // Get user info
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user.length) {
      throw new Error('User not found');
    }

    try {
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
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error);
      throw new Error(`Failed to create payment intent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Confirm payment and add credits to user account
   */
  async confirmPayment(paymentIntentId: string, userId: number) {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
    }

    try {
      // Verify payment intent
      console.log(`Retrieving payment intent: ${paymentIntentId}`);
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      console.log(`Payment intent status: ${paymentIntent.status}`);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not completed. Status: ${paymentIntent.status}`);
    }

    const { packageId, credits } = paymentIntent.metadata;
    console.log(`Payment metadata - packageId: ${packageId}, credits: ${credits}`);
    
    if (!packageId || !credits) {
      throw new Error('Invalid payment metadata - missing packageId or credits');
    }
    
    const creditsToAdd = parseInt(credits);
    if (isNaN(creditsToAdd) || creditsToAdd <= 0) {
      throw new Error(`Invalid credits amount: ${credits}`);
    }

    // Start transaction
    console.log(`Starting database transaction for user ${userId}, adding ${creditsToAdd} credits`);
    const result = await db.transaction(async (tx) => {
      // Get current user balance
      const currentUser = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!currentUser.length) {
        throw new Error(`User not found: ${userId}`);
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
    } catch (error) {
      console.error('Stripe payment confirmation failed:', error);
      throw new Error(`Failed to confirm payment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deduct credits for AI usage
   */
  async deductCredits(
    userId: number,
    tokensConsumed: number,
    modelUsed: string,
    chatSessionId?: number,
    costOverride?: number,
  ) {
    console.log(`🔍 deductCredits called: userId=${userId}, tokens=${tokensConsumed}, model=${modelUsed}`);
    // Skip deduction for free/default models (e.g., Josudo via OpenRouter DeepSeek Free)
    const isFreeDefaultModel =
      modelUsed === 'deepseek-v3' || 
      modelUsed === 'josudo' || 
      /:free\b/i.test(modelUsed) || 
      /deepseek.*free/i.test(modelUsed);

    if (isFreeDefaultModel) {
      console.log('🆓 Free/default model detected. Skipping credit deduction. Logging usage with 0 cost.');
      // Fetch current balance to return
      const currentUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const balanceBefore = currentUser[0]?.credits || 0;

      // Log usage with zero cost/credits
      await db.insert(usageLogs).values({
        userId,
        chatSessionId: chatSessionId || null,
        modelUsed,
        tokensConsumed,
        creditsDeducted: 0,
        cost: '0',
        status: 'completed',
        metadata: { balanceBefore, balanceAfter: balanceBefore, note: 'free_model' },
      });

      return { creditsDeducted: 0, newBalance: balanceBefore };
    }

    // Calculate credits to deduct based on cost (1 credit = $0.01)
    // We need to calculate the actual cost first, then convert to credits
    let cost = typeof costOverride === 'number' ? costOverride : 0;
    
    // Calculate cost based on model (same logic as in routes)
    if (costOverride === undefined) {
      if (modelUsed === "gpt-5") {
        cost = (tokensConsumed / 1000) * 0.002; // $0.002 per 1K tokens
      } else if (modelUsed === "deepseek-v3") {
        cost = (tokensConsumed / 1000) * 0.0002; // $0.0002 per 1K tokens
      } else if (modelUsed === "claude-3-5-sonnet-replicate") {
        cost = (tokensConsumed / 1000) * 0.003; // $0.003 per 1K tokens
      } else if (modelUsed === "claude-3-haiku-replicate") {
        cost = (tokensConsumed / 1000) * 0.00025; // $0.00025 per 1K tokens
      } else if (modelUsed === "sora-2-replicate") {
        cost = 0.05; // $0.05 per video generation
      } else {
        cost = (tokensConsumed / 1000) * 0.0002; // Default rate
      }
    }
    
    const creditsToDeduct = Math.ceil(cost * 100); // Convert cost to credits (1 credit = $0.01)
    console.log(`🔍 Calculated: cost=$${cost}, creditsToDeduct=${creditsToDeduct}`);
    
    const result = await db.transaction(async (tx) => {
      // Get current user balance
      const currentUser = await tx.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!currentUser.length) {
        console.log(`🔍 User not found: ${userId}`);
        throw new Error('User not found');
      }

      const balanceBefore = currentUser[0].credits || 0;
      console.log(`🔍 User ${userId} current balance: ${balanceBefore} credits`);
      
      if (balanceBefore < creditsToDeduct) {
        console.log(`🔍 Insufficient credits: need ${creditsToDeduct}, have ${balanceBefore}`);
        throw new Error('Insufficient credits');
      }

      const balanceAfter = balanceBefore - creditsToDeduct;
      console.log(`🔍 Will deduct ${creditsToDeduct} credits, new balance: ${balanceAfter}`);

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

    console.log(`🔍 Transaction completed successfully:`, result);
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
