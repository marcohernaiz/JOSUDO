import Stripe from "stripe";
import { getSecret } from "../admin";

let stripe: Stripe | null = null;

const getStripeClient = () => {
  const secretKey = getSecret('STRIPE_SECRET_KEY');
  if (!secretKey) {
    throw new Error('Stripe secret key not configured. Please configure it in the admin panel.');
  }
  
  if (!stripe) {
    stripe = new Stripe(secretKey, {
      apiVersion: "2023-10-16",
    });
  }
  
  return stripe;
};

class BillingService {
  async createPaymentIntent(amount: number) {
    try {
      const stripeClient = getStripeClient();
      const paymentIntent = await stripeClient.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true
        }
      });
      
      return paymentIntent;
    } catch (error) {
      console.error('Stripe payment intent error:', error);
      throw new Error('Failed to create payment intent');
    }
  }

  async createSubscription(customerId: string, priceId: string) {
    try {
      const stripeClient = getStripeClient();
      const subscription = await stripeClient.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });
      
      return subscription;
    } catch (error) {
      console.error('Stripe subscription error:', error);
      throw new Error('Failed to create subscription');
    }
  }

  async createCustomer(email: string, name: string) {
    try {
      const stripeClient = getStripeClient();
      const customer = await stripeClient.customers.create({
        email,
        name,
      });
      
      return customer;
    } catch (error) {
      console.error('Stripe customer creation error:', error);
      throw new Error('Failed to create customer');
    }
  }

  calculateUsageCost(tokens: number, model: string = "gpt-4o"): number {
    // Platform markup on top of actual API costs
    const baseCosts = {
      "gpt-4o": 0.03,
      "gpt-4": 0.06,
      "gpt-3.5-turbo": 0.002
    };
    
    const markup = 1.2; // 20% markup
    return (tokens / 1000) * (baseCosts[model as keyof typeof baseCosts] || baseCosts["gpt-4o"]) * markup;
  }
}

export const billingService = new BillingService();
