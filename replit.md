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

- November 4, 2025. Replaced Groq with Replicate in LLM keys and made scrollbars always visible
  - **LLM Provider Changes**: Removed Groq from LLM keys, keeping Replicate
    - Removed GROQ_API_KEY from frontend LLM_KEYS array and backend seeding
    - Deleted GROQ_API_KEY from database
    - Added REPLICATE_API_TOKEN placeholder (r8_placeholder) to backend seeding
    - Final LLM keys list (8 total): OpenAI, Anthropic, Google, Grok, Perplexity, DeepSeek, OpenRouter, Replicate
  - **Visible Scrollbars**: Changed overflow-y-auto to overflow-y-scroll for always-visible scrollbars
    - LLM Keys section: overflow-y-scroll with max-h-[50vh]
    - Other Keys section: overflow-y-scroll with max-h-[50vh]
    - Persona Templates: overflow-y-scroll with max-h-[70vh]
    - Scrollbars now always visible regardless of content height
  - **Database State**: 8 LLM API keys + other platform keys, 27 active persona templates
  - **E2E Testing**: Verified 8 LLM keys without Groq, Replicate present, scrollbars visible on all tabs
  - Modified files: ApiKeysTab.tsx, PersonaTemplatesTab.tsx, server/admin.ts

- November 4, 2025. Completed admin dashboard with automatic LLM provider placeholder seeding
  - **Automatic Placeholder Seeding**: Updated seedPlatformKeys() to automatically insert placeholder values for missing LLM provider keys
    - Placeholders created for: Anthropic (sk-ant-placeholder), Google (AIza-placeholder), Grok (xai-placeholder), Perplexity (pplx-placeholder), DeepSeek (sk-placeholder)
    - All placeholder keys stored unencrypted by default (isEncrypted: false)
    - Seeding runs on every app startup, ensuring keys always appear in admin UI
  - **Scrolling Improvements**: Both admin tabs now have proper scrollable containers with sticky headers
    - API Keys tab: max-h-[50vh] scrollable area with sticky table headers
    - Persona Templates tab: max-h-[70vh] scrollable area with sticky table headers
  - Backend seeding logic: server/admin.ts seedPlatformKeys() function
  - Frontend components: ApiKeysTab.tsx (LLM/Other sections), PersonaTemplatesTab.tsx

- November 4, 2025. Enhanced admin backend with categorized LLM API keys management
  - **LLM Provider Keys**: Added all requested LLM provider keys to seeding function
    - ChatGPT (OPENAI_API_KEY), Claude (ANTHROPIC_API_KEY), Gemini (GOOGLE_API_KEY)
    - Grok (GROK_API_KEY), Perplexity (PERPLEXITY_API_KEY), DeepSeek (DEEPSEEK_API_KEY)
    - OpenRouter (OPENROUTER_API_KEY), Replicate (REPLICATE_API_TOKEN), Groq (GROQ_API_KEY)
  - **Categorized API Keys Interface**: Updated ApiKeysTab to show two distinct sections
    - "LLM Keys" section: displays all AI language model provider keys with descriptions
    - "Other Keys" section: displays platform infrastructure keys (Stripe, Database, Admin, etc.)
    - Both sections maintain full CRUD functionality (Create, Read, Update, Delete)
    - Masked value display with eye icon toggle for security
  - **Keys Storage**: All keys stored unencrypted by default (isEncrypted: false) for easy access
  - **Platform Key Seeding**: Automatic seeding from environment variables on app startup
  - **Admin Verification**: All 27 Digital Persona templates and API keys verified appearing correctly
  - Admin credentials: username="admin", password="Josudo2025!" (from environment variables)
  - Fixed TypeScript type error in loadSettings function (explicit type annotation)
  - E2E testing verified full admin dashboard functionality working correctly

- November 4, 2025. Enabled "Create New" button in Digital Personas menu
  - Added `handleCreateNew` click handler to create new personas from scratch
  - Users can now create custom digital personas without using templates
  - Create New button opens PersonaConfiguration in blank mode with empty fields
  - New personas are saved to user's profile via POST /api/digital-personas
  - Added data-testid="button-create-new-persona" for UI testing
  - Implementation preserves existing template-based and edit-existing-persona flows

- November 4, 2025. Implemented unified Platform API Keys management system with secure admin authentication
  - **Unified API Keys System**: Merged environment variables and database-stored API keys into single editable list
    - All platform API keys stored in database (appSettings table) with optional encryption
    - Keys are **unencrypted by default** (isEncrypted: false) per user preference
    - Platform keys auto-seeded from environment on startup: OpenAI, Anthropic, DeepSeek, Google, Groq, Replicate, Stripe, Database, Session Secret, Admin credentials
    - Full CRUD operations: Create, Read, Update, Delete for all keys
    - Single "Platform API Keys" tab in admin dashboard showing unified list
  - **Security Architecture**:
    - Encryption is optional - requires 32-character ENCRYPTION_KEY environment variable if enabled
    - Proper AES-256-CBC encryption with random IV when encryption is enabled
    - All admin API endpoints protected by requireAdmin middleware
    - **No development mode bypass** - authentication always enforced
    - Session-based authentication with bcrypt password hashing
    - OIDC claim-based authentication support for testing (isAdmin: true claim)
  - **Authentication Flow**:
    - /admin route redirects to /admin/login (no bypass to dashboard)
    - Admin dashboard checks authentication via /api/admin/check-auth before rendering
    - Admin credentials from environment variables (ADMIN_USERNAME, ADMIN_PASSWORD)
    - Unauthenticated users receive 401 and redirect to login
  - **Admin Dashboard Structure**:
    - Platform API Keys tab: Single unified list of all platform keys with edit/delete functionality
    - Digital Persona Templates tab: Create, edit, delete persona templates visible to all users
    - Material Design-inspired interface with Linear's minimalist clarity
  - **Database Schema**:
    - appSettings table: id, key, value, is_encrypted (default: false), timestamps
    - adminUsers table: secure password storage with bcrypt hashing
  - Admin routes: /admin (redirect), /admin/login (public), /admin/dashboard (authenticated only)
  - All CRUD operations verified working for both API keys and persona templates

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