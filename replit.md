# AI Assistant Platform MVP

## Overview

This is a B2B2C AI assistant platform built as a smart middleware solution - users bring their own AI accounts and storage, while the platform provides a unified interface and intelligent routing logic. The application follows a "Zapier for AI models" approach, enabling seamless integration between different AI providers and cloud storage solutions.

## System Architecture

### Technology Stack
- **Frontend**: React with TypeScript, Tailwind CSS for styling
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Google OAuth 2.0 with Passport.js
- **Payment Processing**: Stripe integration
- **Build Tool**: Vite for frontend bundling
- **UI Components**: Radix UI with shadcn/ui components

### Architecture Pattern
The application follows a microservices-inspired pattern with distinct service layers:
- **Auth Service**: Handles Google OAuth and session management
- **Integration Service**: Manages AI model and cloud storage connections
- **Routing Service**: Provides intelligent AI request routing
- **Billing Service**: Tracks usage and manages subscriptions
- **Storage Service**: Handles external cloud storage operations

## Key Components

### Database Schema
- **Users**: Stores user profiles, authentication data, and subscription information
- **Integrations**: Manages connections to AI models and storage providers
- **Chat Sessions**: Tracks conversation history and metadata
- **Usage Logs**: Records token consumption and associated costs
- **Billing**: Manages monthly balances and overage tracking

### Authentication System
- Google OAuth 2.0 integration using Passport.js
- Session-based authentication with express-session
- PostgreSQL session storage using connect-pg-simple

### AI Integration Layer
- **OpenAI Service**: Handles GPT-4 model interactions
- **Google Drive Service**: Manages cloud storage operations
- Support for multiple AI providers (OpenAI, Claude, etc.)
- Encrypted credential storage for user API keys

### Frontend Architecture
- React with TypeScript for type safety
- Context API for global state management (AppContext)
- React Query for server state management
- Wouter for client-side routing
- Responsive design with mobile-first approach

## Data Flow

### User Authentication
1. User initiates Google OAuth flow
2. Passport.js handles OAuth callback
3. User profile created/updated in database
4. Session established with billing record initialization

### AI Chat Flow
1. User sends message through chat interface
2. System routes request to appropriate AI model
3. Usage tracking logs token consumption and costs
4. Response stored in external cloud storage
5. Chat session metadata updated

### Integration Management
1. Users provide API credentials for AI models/storage
2. Credentials encrypted and stored in database
3. Real-time validation of API key functionality
4. Service activation/deactivation controls

## External Dependencies

### AI Providers
- **OpenAI**: Primary AI model provider (GPT-4)
- **Claude**: Secondary AI model option
- Extensible architecture for additional providers

### Cloud Storage
- **Google Drive**: Primary storage integration
- **Neon Database**: PostgreSQL hosting
- Support for additional storage providers

### Payment Processing
- **Stripe**: Subscription management and payment processing
- Usage-based billing with $9.99 base plan
- Overage tracking and automated billing

### Development Tools
- **Neon Database**: Serverless PostgreSQL
- **Drizzle Kit**: Database migrations and schema management
- **Vite**: Development server and build tool
- **TypeScript**: Type safety across the stack

## Deployment Strategy

### Docker Containerization
- Application ready for Docker deployment
- Environment-based configuration
- Production and development environment separation

### Build Process
- Vite handles frontend bundling
- ESBuild for server-side TypeScript compilation
- Automated database migrations with Drizzle Kit

### Environment Configuration
- Database URL configuration for PostgreSQL
- OAuth credentials for Google authentication
- Stripe API keys for payment processing
- AI provider API keys for model access

## Changelog

- July 08, 2025. Initial setup
- July 08, 2025. Added secure admin backend for API key management
  - Created admin panel at `/admin/login` (Username: admin, Password: josudo2025!)
  - Updated services to use admin-managed keys instead of environment variables
  - Added demo login functionality for testing without Google OAuth

## User Preferences

Preferred communication style: Simple, everyday language.