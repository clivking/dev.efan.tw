# Admin Function Map

## Goal

Map the current admin area by real operating modules, not by guesswork.

Current admin shell source:

- `app-legacy-base/src/app/(admin)/admin/layout.tsx`

Current visible side navigation:

- dashboard
- quotes
- customers
- products
- chat
- pages
- settings

Additional admin routes also exist outside the main visible nav:

- guides
- portal
- users
- audit
- seo-logs
- test-backfill

## Core Admin Modules

These are clearly part of the main working system and should be treated as first-class admin areas.

### Dashboard

Main files:

- `app-legacy-base/src/app/(admin)/admin/dashboard/*`
- `app-legacy-base/src/app/api/dashboard/route.ts`
- `app-legacy-base/src/components/dashboard/*`

Primary role:

- business summary
- recent quotes
- pending actions
- revenue trend

### Quotes

Main pages:

- `/admin/quotes`
- `/admin/quotes/new`
- `/admin/quotes/templates`
- `/admin/quotes/[id]`

Main files:

- `app-legacy-base/src/app/(admin)/admin/quotes/*`
- `app-legacy-base/src/components/admin/quotes/*`
- `app-legacy-base/src/app/api/quotes/*`
- `app-legacy-base/src/app/api/templates/*`

Observed capabilities:

- quote list
- create quote
- quote detail
- quote templates
- variants
- items
- duplicate / clone
- new version
- generate token
- views
- signature
- status updates
- payments
- PDF outputs
- Excel export
- save as template / import template

### Customers

Main pages:

- `/admin/customers`
- `/admin/customers/new`
- `/admin/customers/[id]`
- `/admin/customers/[id]/edit`

Main files:

- `app-legacy-base/src/app/(admin)/admin/customers/*`
- `app-legacy-base/src/components/admin/CustomerTable.tsx`
- `app-legacy-base/src/components/admin/CustomerForm.tsx`
- `app-legacy-base/src/app/api/customers/*`

Observed capabilities:

- customer list
- create / edit customer
- import / export
- merge
- customer contacts
- companies
- locations
- portal-related customer section

### Products

Main pages:

- `/admin/products`
- `/admin/products/new`
- `/admin/products/[id]`
- `/admin/products/[id]/edit`
- `/admin/products/[id]/content`

Main files:

- `app-legacy-base/src/app/(admin)/admin/products/*`
- `app-legacy-base/src/components/admin/ProductTable.tsx`
- `app-legacy-base/src/components/admin/ProductForm.tsx`
- `app-legacy-base/src/components/admin/products/*`
- `app-legacy-base/src/app/api/products/*`

Observed capabilities:

- product list
- product create / edit
- import / export
- sort order
- category management
- website content batch actions
- content images
- documents
- FAQ
- SEO tab
- quote tab
- frontend tab
- spec templates
- video URLs

### Chat

Main pages:

- `/admin/chat`

Main files:

- `app-legacy-base/src/app/(admin)/admin/chat/page.tsx`
- `app-legacy-base/src/app/api/chat/*`
- `app-legacy-base/src/app/api/public/chat/*`
- `app-legacy-base/src/components/chat/*`

Observed capabilities:

- chat session management
- AI consultation flow
- transfer handling
- polling
- session-level follow-up
- Telegram-connected human handoff

### Pages / Content

Main pages:

- `/admin/pages`
- `/admin/pages/[slug]`

Main files:

- `app-legacy-base/src/app/(admin)/admin/pages/*`
- `app-legacy-base/src/app/api/pages/*`
- `app-legacy-base/src/components/admin/RichEditor.tsx`
- `app-legacy-base/src/components/admin/ContentMetadataSection.tsx`

Observed capabilities:

- editable page content
- metadata and content editing
- public page support

### Settings

Main pages:

- `/admin/settings`

Main files:

- `app-legacy-base/src/app/(admin)/admin/settings/*`
- `app-legacy-base/src/app/api/settings/*`
- `app-legacy-base/src/app/api/ai/*`
- `app-legacy-base/src/app/api/telegram/*`
- `app-legacy-base/src/app/api/notifications/*`

Observed capabilities:

- company settings
- quote settings
- display / document settings
- AI settings
- Telegram and email settings
- security and API settings
- SEO settings
- users tab
- audit tab
- AI model loading and test connection
- Telegram bot test
- Telegram webhook setup
- Telegram test message
- SMTP test email

## Important Admin Modules Outside Main Sidebar

These modules are real features even if they are not part of the main side navigation.

### Guides

Main pages:

- `/admin/guides`
- `/admin/guides/new`
- `/admin/guides/[id]`

Role:

- guide article management
- SEO / content operations

### Portal

Main pages:

- `/admin/portal`

Role:

- portal content and asset management

### Users

Main pages:

- `/admin/users`

Role:

- separate user management page
- overlaps with settings users tab

### Audit

Main pages:

- `/admin/audit`

Role:

- audit log inspection

### SEO Logs

Main pages:

- `/admin/seo-logs`

Role:

- SEO-related operational logs

## Operational Support APIs

These are part of the admin ecosystem even if they are not pages by themselves.

- `/api/auth/*`
- `/api/upload/*`
- `/api/uploads/[...path]`
- `/api/health`
- `/api/cron/reminders`

## Current Improvement Order

Since the user wants all existing pages and functions kept, improvement should follow this order:

1. quotes
2. customers
3. products
4. settings
5. chat
6. pages
7. dashboard
8. guides
9. portal
10. users / audit / seo logs

## Current Recommendation

Treat the admin system as a complete working product, not a candidate for feature reduction.

Use this map for:

- deciding cleanup order
- deciding test order
- deciding which admin flows to improve first
