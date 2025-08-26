# Stripe Payment Integration Setup

This application now includes Stripe payment integration for purchasing AI credits. Follow these steps to set up the payment system:

## Backend Setup

1. **Install Stripe package** (already done):
   ```bash
   cd server
   npm install stripe
   ```

2. **Set environment variables** in your server `.env` file:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
   ```

3. **Get your Stripe keys**:
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/)
   - Navigate to Developers → API keys
   - Copy your Secret key (starts with `sk_test_` for testing)

## Frontend Setup

1. **Install Stripe package** (already done):
   ```bash
   cd client
   npm install @stripe/stripe-js
   ```

2. **Set environment variables** in your client `.env` file:
   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
   ```

3. **Get your Stripe publishable key**:
   - In the same Stripe Dashboard → Developers → API keys
   - Copy your Publishable key (starts with `pk_test_` for testing)

## Credit Packages

The system comes with two predefined credit packages:

- **Basic Package**: 1000 credits for $10.00
- **Premium Package**: 2500 credits for $20.00

## How It Works

1. User clicks "Upgrade plan" button in the sidebar
2. Payment modal opens showing available credit packages
3. User selects a package and clicks "Pay with Card"
4. Stripe payment form appears
5. After successful payment, user is redirected to success page
6. Credits are added to user's account

## Testing

- Use Stripe test cards for development
- Test card number: `4242 4242 4242 4242`
- Any future expiry date and CVC will work

## Production

- Replace test keys with live keys when deploying
- Update webhook endpoints for production
- Ensure proper error handling and logging

## Security Notes

- Never expose your Stripe secret key in frontend code
- Always use HTTPS in production
- Implement proper user authentication before payments
- Consider adding webhook verification for payment confirmations
