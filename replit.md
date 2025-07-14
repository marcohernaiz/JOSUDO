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
- July 08, 2025. Integrated DeepSeek AI as default free model
  - Users can now start chatting immediately without API keys
  - DeepSeek provides free AI responses with zero cost to users
  - Graceful fallback to DeepSeek when premium models fail
  - Platform displays "DeepSeek (Free)" as default model in UI
- July 08, 2025. Updated branding and UI improvements
  - Rebranded platform from "AI Assistant" to "Josudo" across all components
  - Simplified welcome screen without popup, streamlined chat experience
  - Updated page title, headers, and sidebar branding
  - Removed authentication page - app now auto-logs in with demo account and goes directly to chat
  - Made sidebar dynamic - auto-hides on desktop and only appears on hover, maintaining mobile toggle functionality
  - Created comprehensive AI model selector with all providers (DeepSeek, ChatGPT, Claude, Gemini, Grok, Llama)
  - Added storage selector for Google Drive and IPFS integration with visual status indicators
- July 09, 2025. Enhanced chat interface with ChatGPT-style input features
  - Added file upload button (+) and tools button on the left side of input
  - Integrated microphone and audio conversation icons inside the input field
  - Updated placeholder text to include tool suggestions
  - Improved input layout with proper spacing and hover effects
  - All icons are positioned exactly like ChatGPT's interface for familiar user experience
  - Restructured into two-line layout: input box on first line, all controls on second line
  - Added video conferencing and MCP integrations buttons
  - Created processing provider selector (AWS, Google Cloud, Azure, Josudo) with Josudo selected by default
- July 09, 2025. Integrated futuristic wave & particles background animation
  - Removed welcome message and repositioned input to lower center screen
  - Replaced static background with animated wave patterns and floating particles
  - Implemented CSS-based animation inspired by futuristic wave video (YouTube: H41fuhz_gvw)
  - Added turquoise, purple, and blue color scheme with flowing gradients
  - Created multi-layered particle effects with rotation and scaling animations
  - Enhanced visual depth with wave flow and particle flow animations running at different speeds
  - Fixed text input lines to have consistent width for better visual alignment
- July 09, 2025. Enhanced second row buttons with dynamic hover effects
  - Added expand-on-hover animations to all second row buttons (file upload, tools, microphone, audio, video, settings)
  - Implemented smooth width transitions with label reveals for circular buttons
  - Added scale and shadow effects for dropdown selectors (AI model, storage, processing provider)
  - Created group hover states with opacity transitions for text labels
  - Enhanced user experience with intuitive visual feedback on all control elements
- July 09, 2025. Updated selectors to icons and fixed header branding
  - Collapsed AI model, storage, and processing provider selectors into circular icons with hover expansion
  - Replaced "Josudo" text in header with official brand logo image
  - Fixed icon display consistency across all UI elements
  - Maintained tooltip functionality for better user experience
- July 09, 2025. Fixed icon visibility issues with emoji-based solution
  - Removed FontAwesome CSS dependency from HTML file to prevent conflicts
  - Replaced all Lucide React icons with emoji symbols for guaranteed visibility
  - Used text-based icons: + (file upload), 🔧 (tools), 🤖 (AI model), 💾 (storage), ⚡ (processing), 🎤 (voice), 🎧 (audio), 📹 (video), ⚙️ (settings)
  - Maintained all hover expansion effects and dynamic width transitions
  - All button icons now display correctly with proper colors and functionality
- July 14, 2025. Removed authentication system for open access
  - Removed demo user login system - users can now access without logging in
  - Simplified AppContext to work without authentication requirements
  - Updated all API endpoints to work without user authentication
  - Chat functionality now works directly without requiring user accounts
  - All integration, billing, and session endpoints return mock data or empty arrays
  - Application now provides instant access to AI chat functionality
  - Completely removed authentication screens - app loads directly to main chat interface
  - Simplified sidebar to show "DeepSeek (Free)" as active AI model with disabled chat history
  - Cleaned up all user-specific components and Avatar references
- July 14, 2025. Updated message input interface layout
  - Moved processing provider selector to center section alongside AI model and storage selectors
  - Changed default AI model from DeepSeek to Grok
  - Set default storage to "No Storage" with clear text display
  - Processing provider selector now displays "Josudo" as default with expanded text
  - Reorganized layout: tools (left), AI model/storage/processing (center), voice/audio/video/settings (right)
  - All center selectors now show text by default instead of icon-only hover expansion
  - Maintained futuristic design with animated background and consistent styling
- July 14, 2025. Enhanced sidebar with dark theme
  - Changed sidebar background from white to dark slate (slate-900)
  - Updated all borders to use dark slate colors (slate-700)
  - Modified text colors to white and light slate tones for better contrast
  - Updated active configuration section with darker background (slate-800)
  - Enhanced button styling with dark hover states
  - Improved settings icon visibility with enhanced styling
  - Chat history section now uses darker text colors to match overall theme
- July 14, 2025. Added comprehensive icons to sidebar components
  - Added + icon to the left of "New Chat" button
  - Added 🤖 AI icon to the left of AI model (now showing Grok instead of DeepSeek)
  - Added 💾 storage icon to the left of storage model status
  - Added ⚡ processing icon to the left of processing provider (Josudo)
  - Added ⚙️ settings icon to the left of settings button
  - Updated active configuration to show current defaults: Grok AI, No Storage, Josudo Processing
  - All icons use consistent emoji-based symbols with appropriate color coding
- July 14, 2025. Added official Josudo logo to sidebar branding
  - Integrated golden trinity knot logo (image_1752482001299.png) next to Josudo brand name
  - Logo displays at 40x40 pixels with proper aspect ratio and object-contain styling
  - Added brightness filter enhancement for better visibility against dark background
  - Included fallback amber fleur-de-lis icon (⚜️) if image fails to load
  - Used proper asset import syntax for reliable image loading
  - Replaced generic robot icon with official brand logo for professional appearance
- July 14, 2025. Replaced Josudo text with official brand image
  - Integrated Josudo text logo (image_1752482551893.png) to replace plain text
  - Text logo displays at h-35 height with object-contain styling for optimal proportions
  - Added brightness filter for enhanced visibility on dark sidebar
  - Reduced spacing between logo and new chat button for tighter layout
  - Included fallback text option if image fails to load
  - Complete brand identity now uses official logo images for both symbol and text
- July 14, 2025. Implemented always-visible contracted sidebar with hover expansion
  - Sidebar now always visible at 64px width (w-16) showing icons only
  - Hover expansion to 256px width (w-64) reveals full text and functionality
  - Smooth transition animations with duration-300 for fluid user experience
  - Main content automatically offset by sidebar width (ml-16) on desktop
  - Icons displayed: Josudo logo, + (new chat), 🤖 (AI), 💾 (storage), ⚡ (processing), ⚙️ (settings)
  - Expanded view shows: full text labels, configuration details, chat history, and settings
  - Mobile behavior unchanged with toggle-based sidebar overlay
- July 14, 2025. Enhanced sidebar with optimized icon sizing and animation
  - Increased all sidebar icons from text-lg to text-2xl for better visibility
  - Centered all icons in contracted view using conditional justify-center styling
  - Added semi-transparent background (bg-slate-900/80) for better visual blend
  - Reduced animation duration to 75ms for very fast, responsive expansion
  - Improved user experience with larger, more accessible interface elements
- July 14, 2025. Replaced animated wave background with Sophia AI image
  - Integrated new Sophia AI background image (Sophia background_1752487018233.png)
  - Replaced CSS-based wave animations with static background image using cover sizing
  - Added subtle black overlay (bg-black/20) for improved text readability
  - Maintained optional particle effects overlay for enhanced AI aesthetic
  - Background uses proper asset import system for reliable image loading
  - Enhanced futuristic design with AI-themed visual elements
- July 14, 2025. Created transparent CSS cyberpunk universe stars animation
  - Added multi-layered star system with cyan, magenta, and yellow bright stars
  - Implemented moving stars with rotation, scaling, and opacity animations
  - Created cyberpunk grid overlay with transparent cyan and magenta lines
  - Added starsMove (40s and 60s cycles), starsGlow (8s pulse), and cyberPulse (12s) animations
  - Enhanced depth with different animation speeds and reverse movement
  - Fully transparent overlay maintains UI functionality while adding futuristic atmosphere
- July 14, 2025. Centered and expanded chat input interface
  - Centered chat box with max-width-4xl and auto margins for optimal positioning
  - Expanded input box height from 12 to 14 (h-14) for better user experience
  - Increased text size to large (text-lg) and enhanced padding (px-6)
  - Adjusted send button position to match expanded input box (right-3 top-3)
  - Enhanced container padding from p-4 to p-6 for better visual balance
  - Improved spacing between input and control buttons (mt-4)
- July 14, 2025. Enhanced dropdown menu readability and hover states
  - Improved dropdown background opacity to 0.98 with stronger 20px backdrop blur
  - Added semi-transparent background to dropdown items (rgba(30, 41, 59, 0.4))
  - Enhanced text contrast with #f1f5f9 color for better visibility
  - Fixed hover state with very light background (rgba(248, 250, 252, 0.95))
  - Changed hover text to dark (#0f172a) for maximum contrast on light background
  - Updated description text from slate-400 to slate-300 with group-hover:text-slate-600
  - Added group classes to enable proper hover state transitions
  - Removed conflicting inline styles to ensure CSS classes take precedence
- July 14, 2025. Updated dropdown hover background to match main screen buttons
  - Changed dropdown hover from fully opaque white to semi-transparent slate (bg-slate-600/60)
  - Updated text colors to white for better contrast against semi-transparent dark background
  - Changed description text hover to slate-200 for optimal readability
  - Achieved consistent visual style across all interface elements
- July 14, 2025. Centered chat box in main screen
  - Fixed chat box positioning by adding items-center to flex container
  - Removed unnecessary wrapper div constraints that were causing left alignment
  - Chat box now properly centers within the available space after sidebar offset
  - Maintained responsive design for both desktop and mobile layouts
- July 14, 2025. Expanded input box to match control buttons width
  - Modified input box container to use full width matching the second row
  - Both input box and control buttons now span identical width for visual balance
  - Maintained absolute positioning for send button within the expanded input area
  - Achieved consistent visual alignment across both interface rows
- July 14, 2025. Enhanced UI with larger buttons and authentic company logos
  - Increased all button sizes from h-8 to h-10 for better accessibility and visual impact
  - Updated compact button widths from w-8 to w-10 with enhanced padding and text sizing
  - Implemented real company logos for AI models: OpenAI, Anthropic, Google, Meta, and X (xAI)
  - Replaced generic icons with authentic brand logos using react-icons/si library
  - Improved logo positioning in header by reducing padding to px-3 py-1 for tighter corner placement
  - Enhanced overall professional appearance with proper brand representation
- July 14, 2025. Updated storage and processing selectors with authentic company logos
  - Added real company logos to storage options: Google Drive (SiGoogledrive), IPFS (SiIpfs)
  - Added authentic logos to processing providers: Amazon (SiAmazon), Google Cloud (SiGoogle), Microsoft Azure (Cloud)
  - Replaced emoji-based icons with proper brand icons throughout all dropdown menus
  - Maintained consistent color theming: purple for storage, orange for processing
  - Enhanced professional appearance with authentic brand representation across all selectors
- July 14, 2025. Updated Josudo processing icon with official brand logo
  - Replaced generic Bolt icon with official Josudo logo (JOSUDO logo icon_1752491258890.png)
  - Applied orange color filter to match processing provider theme
  - Enhanced brand consistency across all interface elements
  - Logo displays at 16x16 pixels with proper brightness and color adjustments
- July 14, 2025. Added Apple iCloud to storage options
  - Integrated iCloud as a storage option alongside Google Drive and IPFS
  - Added Apple iCloud icon (SiIcloud) with proper purple theming
  - Enhanced storage provider selection with major cloud provider coverage
  - Maintains consistent disconnected status for all storage options
- July 14, 2025. Added Dropbox to storage options
  - Integrated Dropbox as a storage option between iCloud and IPFS
  - Added official Dropbox icon (SiDropbox) with consistent purple theming
  - Enhanced storage provider selection with comprehensive cloud coverage
  - Maintains consistent disconnected status for all storage options
- July 14, 2025. Added Microsoft OneDrive to storage options
  - Integrated OneDrive as a storage option between Dropbox and IPFS
  - Added Cloud icon for OneDrive representation with consistent purple theming
  - Enhanced storage provider selection with complete major cloud coverage
  - Maintains consistent disconnected status for all storage options
- July 14, 2025. Added Mixtral as a free AI model option
  - Integrated Mixtral 8x7B as a free AI model option after DeepSeek
  - Added Zap icon with "Free Mixtral model" description
  - Enhanced AI model selection with additional free option for users
  - Maintains consistent free/premium badge system
- July 14, 2025. Updated DeepSeek to DeepSeek R1
  - Changed model from "DeepSeek" to "DeepSeek R1" with updated description
  - Updated model ID from 'deepseek-chat' to 'deepseek-r1'
  - Maintained free status and Bot icon for consistency
- July 14, 2025. Updated settings modal to match dark theme
  - Changed settings modal background from light (slate-50) to dark (slate-900)
  - Updated sidebar background to slate-800 with slate-700 borders
  - Changed all text colors to white and slate-400 for better contrast
  - Updated integration cards to use slate-800 background with slate-700 borders
  - Enhanced visual consistency with rest of the dark-themed UI
- July 14, 2025. Added expandable subtabs to integrations settings
  - Created expandable sections for AI Models, Cloud Storage, Processing Providers, and MCP Servers
  - Added chevron icons (ChevronDown/ChevronRight) to indicate expand/collapse state
  - Implemented toggle functionality for each section with smooth transitions
  - Enhanced AI models list with Grok and Llama options
  - Added comprehensive processing providers (AWS, Google Cloud, Azure, Josudo)
  - Added MCP servers section with GitHub, Slack, Notion, and Jira integrations
  - All sections default to expanded state for better user experience
- July 14, 2025. Enhanced settings elements readability with improved colors
  - Updated all service icons from slate-400 to colorful variants (blue-400, purple-400, yellow-400, etc.)
  - Changed section header icons from white to cyan-400 for better visibility
  - Enhanced chevron icons from slate-400 to slate-300 for improved contrast
  - Updated status text from slate-400 to slate-300 for better readability
  - Updated placeholder text colors from slate-400 to slate-300 across all tabs
  - Enhanced overall visual hierarchy with better color contrast ratios
- July 14, 2025. Updated all text colors to white for maximum contrast
  - Changed status text from slate-300 to white for better readability
  - Updated chevron icons from slate-300 to white for improved visibility
  - Changed placeholder text in all tabs from slate-300 to white
  - Enhanced overall text contrast for better accessibility
- July 14, 2025. Fixed navigation button text colors to white
  - Added explicit white text color to all sidebar navigation buttons
  - Updated button icons to use white color for consistency
  - Fixed close button text and icon colors to white
  - Enhanced visibility of Billing, Usage, and API Keys navigation buttons
- July 14, 2025. Set all integration sections to collapsed by default
  - Changed all expandedSections state from true to false
  - AI Models, Cloud Storage, Processing Providers, and MCP Servers now start collapsed
  - Users can expand sections as needed for cleaner initial view
- July 14, 2025. Enhanced settings modal borders for dynamic and professional appearance
  - Added subtle border and shadow effects to main dialog with cyan accent
  - Implemented semi-transparent backgrounds with backdrop blur for modern glass effect
  - Enhanced section borders with hover states and smooth transitions
  - Added layered transparency effects consistent with futuristic UI theme
  - Improved visual depth with shadow gradients and backdrop blur effects
- July 14, 2025. Added scrolling capabilities to settings modal
  - Implemented proper scrollable areas for both sidebar navigation and main content
  - Added custom scrollbar styling with dark theme colors
  - Restructured layout with fixed headers and flexible scrollable content areas
  - Enhanced UI with smooth scrolling behavior and webkit scrollbar customization
  - Fixed scrolling issue in expanded sections by adding individual scroll containers
  - Added more storage options (Box, AWS S3, GitHub, GitLab) to test scrolling functionality
- July 14, 2025. Fixed integration display issues and enhanced options visibility
  - Replaced FontAwesome icons with emoji symbols for guaranteed visibility
  - Added DeepSeek R1 and Mixtral as free AI model options
  - Enhanced storage options with Box, AWS S3, GitHub, GitLab
  - Added Discord, Trello, and Asana to MCP servers
  - Improved icon display consistency across all integration sections
  - Fixed section header icons to use emoji symbols for better visibility
- July 14, 2025. Implemented comprehensive light/dark theme toggle system
  - Created ThemeContext with useState and localStorage persistence
  - Added theme toggle button in upper right corner with sun/moon emoji icons
  - Updated all components (sidebar, settings modal, dashboard) to support both themes
  - Enhanced CSS with proper theme variable system using HSL colors
  - Configured Tailwind with darkMode class support and theme-aware styling
  - Made all text, backgrounds, and borders theme-aware with conditional classes
  - Added theme overlay adjustments for both light and dark modes
- July 14, 2025. Applied light grey background to main page
  - Changed main page background from white to slate-50 for subtle light grey in light mode
  - Updated theme overlay to use white/30 opacity in light mode vs black/20 in dark mode
  - Enhanced visual comfort with softer background color while maintaining dark mode aesthetics
- July 14, 2025. Enhanced light mode with even lighter backgrounds
  - Updated main page background to slate-100 for a much lighter grey appearance
  - Modified input box and control buttons to use white/80 backgrounds in light mode
  - Enhanced theme overlay opacity to white/40 for better visibility
  - Applied comprehensive light/dark theme support to all input components and dropdown menus
  - Improved text color contrast for better readability in both themes
  - Updated contracted control button styling with proper light/dark theme support in CSS
  - Enhanced ai-control-button class to display correctly in both light and dark modes
- July 14, 2025. Made backgrounds even lighter in light mode
  - Changed main page background from slate-100 to slate-50 for an even lighter appearance
  - Updated sidebar background to match main page (slate-50) for consistent light theme
  - Increased theme overlay opacity to white/50 for better visibility
  - Achieved uniform light grey aesthetic across all interface elements
- July 14, 2025. Enhanced add files button styling
  - Changed add files button background from white/80 to pure white in light mode
  - Maintains dark mode styling with slate-700/60 background
  - Improved visual prominence of the primary file upload action
- July 14, 2025. Updated all control buttons to white backgrounds
  - Changed all control buttons from white/80 to pure white (bg-white) in light mode
  - Updated CSS ai-control-button class to use full opacity white background
  - Applied to all buttons: tools, AI model, storage, processing, voice, audio, video
  - Maintains dark mode styling with slate-700/60 backgrounds
- July 14, 2025. Moved Josudo logo closer to top of page
  - Moved theme toggle button from top-4 to top-2 for more space
  - Moved mobile menu toggle from top-4 to top-2 for consistency
  - Removed vertical padding from header component (py-1 to py-0)
  - Enhanced logo positioning with pt-0 wrapper for closer top placement
- July 14, 2025. Positioned Josudo logo at absolute top of page
  - Changed header positioning to absolute top-0 left-0 for immediate top placement
  - Removed all vertical padding from header component
  - Added pt-32 to main content area to prevent overlap with absolute positioned header
  - Logo now appears at the very top edge of the page
- July 14, 2025. Enhanced input box and controls with lighter colors
  - Changed main container background from white/70 to slate-50/80 for lighter appearance
  - Updated input box background to slate-50 with lighter border (slate-200)
  - Changed input text color to slate-600 for softer appearance
  - Updated send button to lighter blue-500 instead of blue-600
  - Modified all button text colors from black to slate-600 for consistency
  - Enhanced CSS .ai-control-button to use slate-50 background and lighter borders
  - Updated hover states to use lighter colors with reduced shadow opacity
  - Unified button styling with CSS !important to ensure contracted and expanded views match
  - Removed inline style conflicts to ensure consistent appearance across all control buttons
- July 14, 2025. Changed sidebar background to light grey
  - Updated sidebar background from slate-50 to slate-100 for consistent light grey theme
  - Matches the overall ultra-light aesthetic of the main page and input components
- July 14, 2025. Made main page background even lighter
  - Changed main page background from slate-50 to white for ultra-light appearance
  - Increased theme overlay opacity from white/50 to white/60 for better visibility
  - Achieved maximum lightness while maintaining excellent readability
- July 14, 2025. Made input box background even lighter
  - Changed input container background from slate-50/80 to white/90 for ultra-light appearance
  - Updated input field background from slate-50 to pure white with lighter border (slate-100)
  - Updated control button background from slate-50 to pure white in CSS
  - Achieved maximum lightness across all input components
- July 14, 2025. Made main page background even lighter in light mode
  - Increased theme overlay opacity from white/60 to white/80 for maximum lightness
  - Creates an ultra-bright appearance while maintaining background image visibility
  - Light mode now has the lightest possible background appearance
- July 14, 2025. Adjusted overlay opacity to show background image properly
  - Reduced white overlay from white/80 to white/40 for better background visibility
  - Maintains light theme while allowing Sophia AI background image to be clearly seen
  - Balanced approach between light aesthetic and image visibility
- July 14, 2025. Made sidebar background darker grey in light mode
  - Changed sidebar background from slate-100 to slate-200 for better contrast
  - Provides better visual separation while maintaining light theme aesthetic
- July 14, 2025. Made input container darker in light mode
  - Changed input container background from white/90 to slate-100/90 for better contrast
  - Provides better visual definition while maintaining light theme consistency
- July 14, 2025. Updated sidebar and input container to slate-300 in light mode
  - Changed both sidebar and input container backgrounds to slate-300 for unified appearance
  - Creates consistent medium-grey theme across interface elements
- July 14, 2025. Updated sidebar and input container to custom slate-250 in light mode
  - Created custom CSS class for slate-250 color (rgb(226, 232, 240))
  - Changed both sidebar and input container backgrounds to slate-250 for lighter unified appearance
  - Provides perfect balance between slate-200 and slate-300 for optimal contrast
- July 14, 2025. Updated sidebar Josudo icon with new official brand image
  - Replaced previous logo with new Josudo icon (JOSUDO ICON_1752512850035.png)
  - Fixed import error that was causing undefined josudoLogo reference
  - New icon features golden trinity knot design with enhanced brand identity
- July 14, 2025. Updated sidebar Josudo text logo with new official brand image
  - Replaced previous text logo with new Josudo text (josudo logo just text_1752513004427.png)
  - New text logo features clean golden typography matching the icon design
  - Enhanced brand consistency across all sidebar branding elements
- July 14, 2025. Updated Josudo logo colors for light mode
  - Changed both icon and text logos to completely black in light mode using CSS filters
  - Added custom CSS classes (.josudo-logo-light, .josudo-text-light) with brightness(0) filter
  - Dark mode maintains original unchanged golden appearance without filters
- July 14, 2025. Reduced Josudo text logo size in sidebar
  - Changed text logo height from h-10 to h-8 for better proportions
  - Maintains icon size at 40x40 pixels while making text more compact
- July 14, 2025. Improved dark mode background visibility
  - Reduced dark mode overlay opacity from bg-black/20 to bg-black/10
  - Enhanced visibility of Sophia AI background image and cyberpunk animations
  - Maintains light mode overlay at bg-white/40 for optimal contrast
- July 14, 2025. Further enhanced dark mode animation visibility
  - Reduced dark mode overlay opacity from bg-black/10 to bg-black/5
  - Cyberpunk stars, grid patterns, and particle effects now clearly visible
  - Maintains UI readability while showcasing background animations
- July 14, 2025. Integrated Google Sign-In for storage selection
  - Added handleStorageSelection function to trigger OAuth when selecting Google Drive
  - Updated Google OAuth routes to support storage-specific authentication with Drive permissions
  - Enhanced authentication flow to redirect back to dashboard with storage connection status
  - Users can now authenticate with Google Drive directly from storage selector dropdown
- July 14, 2025. Added Google Sign-In button to main interface
  - Created prominent Google Sign-In button in header with official Google branding
  - Implemented proper authentication state management in AppContext
  - Added both GET and POST logout routes for complete sign-out functionality
  - Authentication status now properly tracked across the entire application
  - Users can sign in with Google directly from the main interface
- July 14, 2025. Enhanced header with repositioned authentication and theme controls
  - Changed Google Sign-In button text from "Sign in with Google" to "Sign in"
  - Updated sign-in button styling to match input box background with theme-aware colors
  - Moved theme toggle button to header, positioned to the right of sign-in button
  - Removed duplicate theme toggle from dashboard page to avoid conflicts
  - Enhanced button layout with proper spacing and consistent styling across light/dark themes
- July 14, 2025. Refined theme toggle button design
  - Removed background from theme toggle button for cleaner appearance
  - Fixed icon logic to show moon (🌙) in dark mode and sun (☀️) in light mode
  - Added subtle hover effect instead of solid background
  - Enhanced visual consistency with minimal, clean design approach
  - Updated button to match page background color (white/black) with no borders
  - Applied ghost variant for seamless integration with header design
- July 14, 2025. Enhanced Google Drive integration with authentication status
  - Updated storage selector to show Google Drive as connected when user is authenticated
  - Modified sidebar to display Google Drive with green status indicator when signed in
  - Added dynamic storage options based on authentication state
  - Enhanced storage selection logic to handle authenticated Google Drive connections
  - Both storage button and sidebar now accurately reflect Google Drive connection status
- July 14, 2025. Updated sign out functionality and styling
  - Changed header sign out button background from red to slate (bg-slate-500 hover:bg-slate-600)
  - Added sign out option to sidebar footer that appears when user is authenticated
  - Sidebar sign out button uses door emoji (🚪) and follows consistent styling patterns
  - Both sign out buttons redirect to '/api/auth/logout' for proper session termination
  - Enhanced sidebar footer with conditional sign out display based on authentication status
  - Updated header sign out button for light mode: white background, icon on right side, no border
  - Light mode styling matches page background with slate text and door emoji positioned after text
  - Removed sign out button from header upper right corner - users now sign out only through sidebar
  - Moved welcome message from upper right corner to left of theme toggle button for better layout
  - Enhanced light mode styling: welcome message uses slate-700 text, theme toggle uses slate-50 background

## User Preferences

Preferred communication style: Simple, everyday language.