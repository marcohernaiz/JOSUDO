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

- November 4, 2025. Implemented secure admin backend for platform management
  - Created secure admin authentication system using environment variables (ADMIN_USERNAME, ADMIN_PASSWORD)
  - **Security Fix**: Removed hardcoded credential fallbacks to prevent security vulnerabilities
  - Admin credentials now strictly required via environment variables - no default fallbacks
  - Application gracefully warns and exits admin initialization if credentials not configured
  - Implemented dual authentication support:
    - Traditional username/password authentication with bcrypt hashing (production)
    - OIDC claim-based authentication for testing (checks for isAdmin: true claim)
  - Implemented admin dashboard with three management tabs:
    - Admin Users Management: Create, edit, delete admin accounts with bcrypt password hashing
    - API Keys Management: Configure platform-wide API keys and settings (replacing hardcoded values)
    - Persona Templates Management: Customize Digital Persona templates visible to all users
  - Admin routes accessible at /admin/login and /admin/dashboard
  - Added adminUsers database table (admin_users) with secure password storage
  - Implemented session-based admin authentication separate from user sessions
  - Admin middleware (requireAdmin) checks both session auth and OIDC claims
  - Admin session endpoint supports both authentication methods
  - Admin panel features Material Design-inspired interface with Linear's minimalist clarity
  - All admin operations require authentication and use middleware protection
  - Successfully tested with environment variable credentials

- September 30, 2025. Enhanced Digital Personas page with hover functionality
  - Added hover overlay on persona cards with "Use" and "Configure" action buttons
  - "Use" button sets the persona as active and navigates to main chat screen
  - "Configure" button opens the persona configuration page
  - Created SelectedPersona type to support both template and user personas
  - Improved user interaction flow for persona management

- August 22, 2025. Redesigned chat interface layout and enhanced user experience
  - Moved JOSUDO AI Assistant button inside chat box, centered with Josudo logo
  - Relocated AI model and storage buttons to the right side of the chat box
  - Chat mode selector now features Josudo logo and is properly sized to match other buttons
  - Simplified layout: File attachment and tools on left, chat mode in center, AI model/storage/voice controls on right
  - Voice controls (dictation, conversation, video) moved to right side for better organization
  - Updated chat mode selector to show only selected option by default, expanding to show all options when clicked
  - Added new "Search existing Digital Personas" option to chat mode selector
  - Chat mode options: JOSUDO AI assistant, Create New Digital Persona, Search existing Digital Personas, Hire a Virtual employee
  - Fixed chatMode variable error that was preventing app from launching
  - Added real-time chat behavior: message immediately moves to chat window on enter
  - Input field clears instantly when user presses enter, allowing immediate new input
  - Send button changes to red pulsing stop button during AI response generation
  - Updated chat input icons to match modern AI interfaces (ChatGPT, Claude, etc.)
  - Changed voice dictation icon from emoji to clean Mic icon from Lucide React
  - Changed voice conversation icon from headphones emoji to Phone icon for clarity
  - Changed video conversation icon from camera emoji to VideoIcon for consistency
  - Replaced expanding text functionality with hover tooltips for cleaner interface
  - Updated file attachment button to use consistent tooltip and modern styling
  - Enforced light mode as the absolute default theme, clearing any stored dark mode preferences
  - Updated sidebar menu items to use blue hover background (blue-50/blue-900) instead of gray
  - Updated chat history items to use consistent blue hover effects matching selection state
  - Updated user profile dropdown hover to use blue background for consistency
  - Added user profile dropdown in sidebar bottom-left with options: Upgrade plan, Settings, Learn more, Log out
  - Fixed TypeScript errors by updating user field references (avatar, username instead of profileImage, displayName)
  - User image and name now appear correctly after sign-in with clickable dropdown functionality

- August 21, 2025. Fixed critical JSX syntax error in MessageInput component
  - Resolved JSX structure issue in AI model dropdown that prevented app from starting
  - Fixed unclosed div element that was causing build failures
  - Application now starts successfully and runs without errors

- August 21, 2025. Updated branding consistency for default AI model
  - Default DeepSeek V3 model now displays as "Josudo AI" throughout the user interface
  - Updated sidebar active configuration to show "Josudo (Free)"
  - Updated AI model selection dropdown to display "Josudo" instead of "DeepSeek V3"
  - Updated chat messages to show "Josudo AI" instead of "DeepSeek V3 (Free)"
  - Updated badge text to show "Josudo AI" instead of "Premium Account" in chat interface
  - Updated billing modal to show "Josudo AI" branding
  - Updated server fallback messages to show "Josudo" instead of "DeepSeek"
  - Technical model routing remains unchanged (still uses deepseek-v3 internally)

- August 21, 2025. Implemented ChatGPT-style clean light mode interface
  - Removed background image and video effects in light mode for clean white background
  - Maintained cyberpunk animations and background image only in dark mode
  - Updated sidebar styling with solid backgrounds in light mode instead of translucent
  - Light mode now matches ChatGPT's clean, distraction-free aesthetic
  - Dark mode preserves the original futuristic design with animations

## User Preferences

Preferred communication style: Simple, everyday language.