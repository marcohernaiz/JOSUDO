# JOSUDO - AI Orchestration Platform

JOSUDO is a comprehensive AI orchestration application that allows users to interact with multiple AI models through a unified interface. Users can purchase credits to use AI services, with their conversations automatically saved to Google Drive.

## Features

- **Multi-AI Model Support**: Integration with OpenAI, Claude, DeepSeek, Gemini, Grok, Llama, and Replicate
- **Credit-Based System**: Pay-per-use model with $10 (1000 credits) and $20 (2500 credits) packages
- **Google Drive Integration**: Automatic chat history storage and retrieval
- **Real-time Chat**: Streaming AI responses with session management
- **Responsive Design**: Modern UI that works on desktop and mobile
- **Authentication**: Google OAuth integration for secure access

## Payment System

The application uses Stripe for secure credit card payments:

- **Basic Package**: 1000 AI credits for $10.00
- **Premium Package**: 2500 AI credits for $20.00
- **Secure Processing**: All payments handled by Stripe
- **Credit Management**: Automatic credit deduction based on AI usage

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/JOSUDO.git
   cd JOSUDO
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in both client and server directories
   - Add your Stripe API keys (see STRIPE_SETUP.md for details)

4. **Run the application**
   ```bash
   # Terminal 1 - Backend
   cd server && npm run dev
   
   # Terminal 2 - Frontend
   cd client && npm run dev
   ```

## Environment Variables

### Server (.env)
```env
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
SESSION_SECRET=your_session_secret
# ... other variables
```

### Client (.env)
```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
# ... other variables
```

## Stripe Setup

For detailed Stripe payment integration setup, see [STRIPE_SETUP.md](./STRIPE_SETUP.md).

## Database Schema

The application uses PostgreSQL with the following key tables:
- `users`: User accounts with credit balances
- `chat_sessions`: Chat conversation metadata
- `usage_logs`: AI usage tracking and billing
- `integrations`: External service connections

## API Endpoints

- `/api/stripe/*` - Payment processing
- `/api/google-drive/*` - Chat storage and retrieval
- `/api/auth/*` - Authentication endpoints
- `/api/user/*` - User profile and credits

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
