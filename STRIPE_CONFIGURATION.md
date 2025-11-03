# 💳 Stripe Configuration for JOSUDO

This document explains the correct Stripe configuration for JOSUDO's frontend and backend.

## 🔧 Environment Variables

### Backend (Server-side)
```env
# Secret key - only used on the server
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
```

### Frontend (Client-side)
```env
# Publishable key - exposed to the browser
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

## 🎯 Why `VITE_` Prefix?

The `VITE_` prefix is required for Vite (the build tool used by JOSUDO) to expose environment variables to the frontend:

- ✅ **`VITE_STRIPE_PUBLISHABLE_KEY`** - Available in browser/client-side code
- ❌ **`STRIPE_PUBLISHABLE_KEY`** - Only available on server-side

## 🔒 Security Considerations

### ✅ Safe to Expose (Frontend)
- `VITE_STRIPE_PUBLISHABLE_KEY` - This is meant to be public
- Starts with `pk_` (publishable key)

### 🔐 Keep Secret (Backend Only)
- `STRIPE_SECRET_KEY` - Never expose this to the frontend
- Starts with `sk_` (secret key)

## 📋 Complete Configuration

### .env File
```env
# Backend Stripe Configuration
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key

# Frontend Stripe Configuration  
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

### Usage in Code

#### Frontend (React/Vite)
```typescript
// This will work because of VITE_ prefix
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// This will NOT work (undefined)
const stripePublishableKey = import.meta.env.STRIPE_PUBLISHABLE_KEY;
```

#### Backend (Node.js)
```typescript
// Server-side code
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
```

## 🚀 Deployment

### Docker Compose
```yaml
environment:
  # Backend
  STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
  # Frontend  
  VITE_STRIPE_PUBLISHABLE_KEY: ${VITE_STRIPE_PUBLISHABLE_KEY}
```

### Environment Variables
```bash
# Set both variables
export STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key"
export VITE_STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key"
```

## 🔍 Troubleshooting

### Frontend Stripe Not Working
```bash
# Check if VITE_ prefix is used
echo $VITE_STRIPE_PUBLISHABLE_KEY

# Verify in browser console
console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
```

### Backend Stripe Errors
```bash
# Check if secret key is set (without VITE_ prefix)
echo $STRIPE_SECRET_KEY

# Verify server-side
console.log(process.env.STRIPE_SECRET_KEY)
```

## 📚 Stripe Keys

### Test Keys (Development)
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### Live Keys (Production)
```env
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

## ✅ Checklist

- [ ] `STRIPE_SECRET_KEY` is set (server-side only)
- [ ] `VITE_STRIPE_PUBLISHABLE_KEY` is set (client-side)
- [ ] Keys match your Stripe account (test vs live)
- [ ] Frontend can access `import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY`
- [ ] Backend can access `process.env.STRIPE_SECRET_KEY`

---

**Remember**: The `VITE_` prefix is crucial for frontend access in Vite-based applications! 🎯








