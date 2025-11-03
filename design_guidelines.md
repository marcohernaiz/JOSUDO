# JOSUDO AI Assistant Admin Dashboard Design Guidelines

## Design Approach
**System-Based**: Material Design-inspired with Linear's minimalist clarity for maximum productivity and professional polish. This utility-focused admin interface prioritizes efficiency, scannable information density, and clear task flows.

## Typography System
**Fonts**: Inter (via Google Fonts CDN)
- Page Titles: 32px/bold
- Section Headers: 24px/semibold  
- Card Titles: 18px/semibold
- Body Text: 14px/regular
- Table Headers: 13px/medium, uppercase tracking
- Input Labels: 13px/medium
- Buttons: 14px/medium

## Layout & Spacing System
**Core Spacing Units**: Tailwind 2, 4, 6, 8, 12, 16 (e.g., p-4, m-8, gap-6)

**Container Strategy**:
- Login page: max-w-md centered
- Dashboard shell: Full viewport with fixed sidebar (256px width)
- Content area: max-w-7xl with px-8 py-6
- Cards/panels: Consistent p-6 padding
- Form sections: space-y-6 between groups

**Grid Patterns**:
- Stats overview: 3-column grid on desktop (grid-cols-3)
- Data tables: Full-width with horizontal scroll
- Form layouts: Single column max-w-2xl for optimal UX

## Component Library

### Navigation Architecture
**Top Bar** (h-16, fixed):
- Left: JOSUDO logo + "Admin" badge
- Right: Admin name, avatar, logout icon
- Background: White with subtle bottom border

**Sidebar** (fixed, w-64):
- Navigation items with icons (20px) + labels
- Sections: Dashboard, Admin Users, API Keys, Personas, Settings
- Active state: Blue background (fill), white text
- Hover: Light blue background tint
- Icons: Heroicons outline style

**Tab Navigation** (within content area):
- Horizontal tabs for sub-sections
- Active: Blue bottom border (3px), blue text
- Inactive: Gray text, transparent
- Spacing: px-6 py-3 per tab

### Data Tables
**Structure**:
- Header row: Light gray background, medium weight text
- Body rows: White background, hover state (very light gray)
- Cell padding: px-6 py-4
- Border: Light gray between rows
- Action column: Right-aligned icons (edit, delete)
- Status badges: Rounded pills with color coding
- Pagination: Bottom-right with page numbers + arrows

**Table Features**:
- Search bar above table (right-aligned)
- Filter dropdowns (left-aligned)
- Column sorting indicators
- Checkbox column for bulk actions

### Forms
**Input Fields**:
- Label above input (mb-2)
- Border: 1px gray, rounded corners (6px)
- Padding: px-4 py-3
- Focus: Blue border, subtle blue shadow
- Error state: Red border + helper text below
- Disabled: Gray background, reduced opacity

**Button Hierarchy**:
- Primary: Blue background, white text, px-6 py-2.5, rounded-md
- Secondary: White background, gray border, gray text
- Danger: Red background for destructive actions
- Text buttons: No background, blue text for tertiary actions

**Form Patterns**:
- Two-column layout for related fields (grid-cols-2 gap-6)
- Full-width for text areas and selects
- Helper text: 12px gray below inputs
- Required indicators: Red asterisk after label

### Modal Dialogs
**Structure**:
- Overlay: Semi-transparent black (50% opacity)
- Card: White, rounded-lg, max-w-lg, centered
- Header: p-6, border-bottom
- Body: p-6
- Footer: p-6, border-top, right-aligned buttons with gap-3

**Types**:
- Confirmation: Title, description, Cancel + Confirm buttons
- Forms: Full form layout with submit/cancel
- Success/Error: Icon + message + single action

### Cards & Panels
**Stats Cards** (Dashboard overview):
- White background, rounded-lg, p-6
- Large number (32px/bold)
- Label below (14px/gray)
- Small trend indicator (icon + percentage, green/red)
- Subtle shadow on hover

**Content Panels**:
- White background, rounded-lg
- Header with title + action button
- Divider line
- Content area with appropriate padding

### Login Page
**Layout**:
- Full viewport with light blue gradient background
- Centered card (max-w-md, p-8, rounded-xl, shadow-xl)
- JOSUDO logo at top (mb-8)
- "Admin Login" title (24px/bold, mb-6)
- Email + password inputs (space-y-4)
- "Remember me" checkbox
- Blue "Sign In" button (full width)
- "Forgot password?" link (right-aligned, 13px)

## Interaction Patterns

**Loading States**:
- Button: Spinner icon replaces text, disabled state
- Tables: Skeleton rows with shimmer animation
- Full page: Centered spinner with JOSUDO logo

**Empty States**:
- Centered icon (64px, gray)
- Message text below
- Call-to-action button

**Feedback**:
- Toast notifications: Top-right corner, auto-dismiss
- Success: Green accent, checkmark icon
- Error: Red accent, warning icon
- Info: Blue accent, info icon

## Dashboard-Specific Layouts

**Dashboard Home**:
- Stats grid (3 cards): Total users, Active keys, Personas count
- Recent activity table (5 rows max)
- Quick actions panel

**List Pages** (Users, Keys, Personas):
- Page header: Title + "Create New" button (right)
- Filters/search bar
- Data table
- Pagination

**Create/Edit Pages**:
- Breadcrumb navigation
- Page title
- Form card with sections
- Sticky footer with Save/Cancel buttons

## Images
No hero images required. Dashboard interfaces use:
- Logos: JOSUDO logo (SVG, 120px width) in top bar and login
- Avatars: Circular (32px) for admin profiles
- Icons: Heroicons throughout (20px for nav, 16px for buttons/tables)
- Empty state illustrations: Simple gray iconography