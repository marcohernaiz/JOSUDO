# AI Assistant Platform MVP

## Overview

This project is a B2B2C AI assistant platform designed as a smart middleware solution. It allows users to integrate their existing AI accounts and cloud storage, providing a unified interface and intelligent routing for AI requests. The platform aims to be a "Zapier for AI models," facilitating seamless connections between various AI providers and cloud storage services, targeting both business and consumer markets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The platform utilizes a modern web technology stack and follows a microservices-inspired architectural pattern.

### Technology Stack
- **Frontend**: React with TypeScript, Tailwind CSS, Radix UI, shadcn/ui
- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Google OAuth 2.0 with Passport.js
- **Payment Processing**: Stripe
- **Build Tool**: Vite

### Architecture Pattern
The application is structured into distinct service layers:
- **Auth Service**: Manages user authentication and sessions.
- **Integration Service**: Handles connections to AI models and cloud storage.
- **Routing Service**: Provides intelligent request routing to AI models.
- **Billing Service**: Manages usage tracking and subscriptions.
- **Storage Service**: Facilitates external cloud storage operations.

### Key Components & Design Decisions
- **Database Schema**: Includes tables for Users, Integrations, Chat Sessions, Usage Logs, and Billing to support core functionalities.
- **Authentication System**: Secure Google OAuth 2.0 with session management.
- **AI Integration Layer**: Supports multiple AI providers (OpenAI, Claude, DeepSeek R1, Mixtral, Grok, Llama) with encrypted API key storage.
- **Frontend Architecture**: Built with React and TypeScript, utilizing Context API for global state, React Query for server state, and Wouter for routing, with a responsive, mobile-first design.
- **UI/UX**: Features a futuristic design with a cyberpunk universe stars animation overlay, a dark/light theme toggle, and a dynamically expanding sidebar. The chat interface is inspired by ChatGPT, with integrated file upload, tools, voice, audio, and video conferencing buttons. Authentic company logos are used for AI models, storage, and processing providers. The settings modal provides expandable subtabs for managing integrations.

### Data Flow
- **User Authentication**: Standard OAuth flow, session establishment, and billing initialization.
- **AI Chat Flow**: User messages are routed to AI models, usage is tracked, responses are stored (optional), and chat metadata is updated.
- **Integration Management**: Users provide encrypted API credentials for real-time validated service activation/deactivation.

## External Dependencies

- **AI Providers**: OpenAI (GPT-4), Claude, DeepSeek R1 (free), Mixtral (free), Grok, Llama.
- **Cloud Storage**: Google Drive, iCloud, Dropbox, Microsoft OneDrive, IPFS, Box, AWS S3, GitHub, GitLab.
- **Payment Processing**: Stripe for subscriptions and usage-based billing.
- **Database Hosting**: Neon Database (PostgreSQL).
- **Icons & Logos**: react-icons/si for company logos.
- **MCP Servers (Integration Examples)**: GitHub, Slack, Notion, Jira, Discord, Trello, Asana.

## Recent Changes

- August 21, 2025. Implemented ChatGPT-style clean light mode interface
  - Removed background image and video effects in light mode for clean white background
  - Maintained cyberpunk animations and background image only in dark mode
  - Updated sidebar styling with solid backgrounds in light mode instead of translucent
  - Light mode now matches ChatGPT's clean, distraction-free aesthetic
  - Dark mode preserves the original futuristic design with animations

## User Preferences

Preferred communication style: Simple, everyday language.