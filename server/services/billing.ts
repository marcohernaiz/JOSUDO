import Stripe from 'stripe';
import { db } from '../db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
}

export const CREDIT_PACKAGES: CreditPackage[] = [
  {
    id: 'basic',
    name: 'Basic Package',
    credits: 1000,
    price: 1000, // $10.00 in cents
    description: '1000 AI credits for basic usage'
  },
  {
    id: 'premium',
    name: 'Premium Package',
    credits: 2500,
    price: 2500, // $25.00 in cents
    description: '2500 AI credits for heavy usage'
  }
];

export class BillingService {
  async createPaymentIntent(packageId: string, userId: string): Promise<{ clientSecret: string; amount: number }> {
    const package_ = CREDIT_PACKAGES.find(p => p.id === packageId);
    if (!package_) {
      throw new Error('Invalid package selected');
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: package_.price,
      currency: 'usd',
      metadata: {
        userId,
        packageId,
        credits: package_.credits.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      amount: package_.price
    };
  }

  async confirmPayment(paymentIntentId: string): Promise<{ success: boolean; credits: number }> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        const credits = parseInt(paymentIntent.metadata.credits || '0');
        const userId = parseInt(paymentIntent.metadata.userId || '0');
        
        if (credits > 0 && userId > 0) {
          // Add credits to user's account
          await this.addCreditsToUser(userId, credits);
        }
        
        return { success: true, credits };
      }
      
      return { success: false, credits: 0 };
    } catch (error) {
      console.error('Error confirming payment:', error);
      return { success: false, credits: 0 };
    }
  }

  async addCreditsToUser(userId: number, credits: number): Promise<void> {
    try {
      await db
        .update(users)
        .set({
          credits: sql`${users.credits} + ${credits}`,
        })
        .where(eq(users.id, userId));
      
      console.log(`Added ${credits} credits to user ${userId}`);
    } catch (error) {
      console.error('Error adding credits to user:', error);
      throw new Error('Failed to add credits to user account');
    }
  }

  async getUserCredits(userId: number): Promise<number> {
    try {
      const result = await db
        .select({ credits: users.credits })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      
      return result[0]?.credits || 0;
    } catch (error) {
      console.error('Error getting user credits:', error);
      return 0;
    }
  }

  async deductCredits(userId: number, credits: number): Promise<boolean> {
    try {
      const currentCredits = await this.getUserCredits(userId);
      
      if (currentCredits < credits) {
        return false; // Insufficient credits
      }
      
      await db
        .update(users)
        .set({
          credits: sql`${users.credits} - ${credits}`,
        })
        .where(eq(users.id, userId));
      
      console.log(`Deducted ${credits} credits from user ${userId}`);
      return true;
    } catch (error) {
      console.error('Error deducting credits from user:', error);
      return false;
    }
  }

  async getCreditPackages(): Promise<CreditPackage[]> {
    return CREDIT_PACKAGES;
  }
}

export const billingService = new BillingService();
