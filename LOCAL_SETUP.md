# 🚀 Local Development Setup Guide

This guide will help you set up the Josudo AI platform for local development.

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (local or cloud)
- **Git**

## 🗄️ Database Setup

### Option 1: Local PostgreSQL
1. Install PostgreSQL locally
2. Create a database:
   ```sql
   CREATE DATABASE josudo_db;
   ```

### Option 2: Neon Cloud Database (Recommended)
1. Go to [Neon Console](https://console.neon.tech/)
2. Create a new project
3. Copy the connection string

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/josudo_db
# OR for Neon: postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb

# Authentication
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
SESSION_SECRET=your_random_session_secret_here

# AI Service API Keys
OPENROUTER_API_KEY=your_openrouter_api_key  # Required for DeepSeek V3.1 Free (default model)
OPENAI_API_KEY=your_openai_api_key          # Optional - for GPT models
ANTHROPIC_API_KEY=your_anthropic_api_key    # Optional - for Claude models
GEMINI_API_KEY=your_gemini_api_key          # Optional - for Gemini models
XAI_API_KEY=your_grok_api_key               # Optional - for Grok models
REPLICATE_API_TOKEN=your_replicate_token    # Optional - for Replicate models

# Stripe Configuration (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Development
NODE_ENV=development
PORT=5000
```

## 🔑 Getting API Keys

### Required (Minimum Setup)
- **DATABASE_URL**: Database connection string
- **SESSION_SECRET**: Any random string (e.g., `my-super-secret-key-123`)
- **OPENROUTER_API_KEY**: For DeepSeek V3.1 Free (default model)

### Optional (For Full Functionality)
- **Google OAuth**: [Google Cloud Console](https://console.cloud.google.com/)
- **OpenAI**: [OpenAI Platform](https://platform.openai.com/)
- **Anthropic**: [Anthropic Console](https://console.anthropic.com/)
- **Google Gemini**: [Google AI Studio](https://makersuite.google.com/)
- **Grok (xAI)**: [xAI Console](https://console.x.ai/)
- **OpenRouter**: [OpenRouter](https://openrouter.ai/) (for DeepSeek V3)
- **Replicate**: [Replicate](https://replicate.com/)
- **Stripe**: [Stripe Dashboard](https://dashboard.stripe.com/)

## 🚀 Installation & Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd JOSUDO
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   # Copy the example and edit with your values
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Set Up Database Schema**
   ```bash
   npm run db:push
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🌐 Access the Application

- **Frontend**: http://localhost:5000
- **Backend API**: http://localhost:5000/api

## 🧪 Testing Without API Keys

The app includes simulated responses for all AI models, so you can test the full functionality without setting up API keys. However, for real AI responses, you'll need the respective API keys.

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Push database schema changes
npm run db:push
```

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL format
- Verify database exists

### Port Already in Use
- Change PORT in .env file
- Or kill the process using port 5000

### API Key Issues
- Check API key format
- Verify API key permissions
- Check rate limits

## 📱 Features Available

### With Minimum Setup (DATABASE_URL + SESSION_SECRET + OPENROUTER_API_KEY)
- ✅ User authentication (local only)
- ✅ Chat interface
- ✅ Real AI responses (DeepSeek V3.1 Free)
- ✅ File uploads
- ✅ Chat history
- ✅ Thinking modes (fast/deep/research)

### With Full API Keys
- ✅ Real AI model responses
- ✅ Google OAuth login
- ✅ Payment processing
- ✅ Google Drive integration
- ✅ Advanced AI capabilities

## 🎯 Default Model

The app uses **DeepSeek V3.1 Free** (called "Josudo") as the default model via OpenRouter. This provides high-quality AI responses completely free of charge!

## 📞 Support

If you encounter issues:
1. Check the console for error messages
2. Verify all environment variables are set
3. Ensure database is accessible
4. Check API key permissions

Happy coding! 🚀
