# Working Copy Feature Inventory

## Scope

This document inventories the current editable working copy:

- app directory: `app-legacy-base`
- app URL: `http://localhost:5100`
- app container: `efan-work-app`
- db container: `efan-work-db`

The goal is not to redesign everything at once. The goal is to separate:

- what must stay online first
- what can be delayed
- what is a likely cleanup or shutdown candidate

## Keep First

These areas are part of the core business flow and should stay available while we continue cleanup.

### Public website

- home page
- header / footer / navigation
- about
- contact
- privacy
- terms
- support
- solutions / services / locations

Main files:

- `src/app/(website)/(frontend)/page.tsx`
- `src/app/(website)/(frontend)/layout.tsx`
- `src/components/layout/*`
- `src/components/home/*`
- `src/components/common/*`

### Product catalog

- product categories
- product list
- product detail pages
- product-related uploads
- public product APIs

Main files:

- `src/app/(website)/(frontend)/products/*`
- `src/components/products/*`
- `src/app/api/products/*`
- `src/app/api/public/products/*`
- `src/app/api/uploads/[...path]/route.ts`

### Quote and inquiry flow

- quote request page
- inquiry badge / inquiry state
- public quote page by token
- quote data APIs

Main files:

- `src/app/(website)/(frontend)/quote-request/*`
- `src/app/(website)/q/[token]/*`
- `src/app/api/quotes/*`
- `src/app/api/public/q/*`
- `src/app/api/public/quote-request/*`

### Customer and quote admin

- admin customers
- admin quotes
- admin products
- login / session validation

Main files:

- `src/app/(admin)/admin/customers/*`
- `src/app/(admin)/admin/quotes/*`
- `src/app/(admin)/admin/products/*`
- `src/app/(admin)/admin/login/*`
- `src/app/api/customers/*`
- `src/app/api/quotes/*`
- `src/app/api/auth/*`

### Site configuration and uploads

- company and site settings
- favicon / logo / uploads serving
- runtime paths

Main files:

- `src/app/api/public/site-config/*`
- `src/app/api/settings/*`
- `src/lib/company.ts`
- `src/lib/settings.ts`
- `src/lib/runtime-paths.ts`

## Keep But Review Later

These areas may still be useful, but they are not the first priority for stabilization.

### Dashboard and reporting

- admin dashboard
- stat cards
- revenue charts
- pending actions

Main files:

- `src/app/(admin)/admin/dashboard/*`
- `src/app/api/dashboard/route.ts`
- `src/components/dashboard/*`

### Guides and content pages

- guides
- pages CMS
- content metadata
- structured content helpers

Main files:

- `src/app/(website)/(frontend)/guides/*`
- `src/app/(admin)/admin/guides/*`
- `src/app/(admin)/admin/pages/*`
- `src/app/api/guides/*`
- `src/app/api/pages/*`
- `src/lib/guide-*`
- `src/lib/page-content.ts`
- `src/lib/content-*`

### Tools and calculators

- CCTV calculator
- SEO helper cards
- budget estimator

Main files:

- `src/app/(website)/(frontend)/tools/*`
- `src/components/tools/*`
- `src/components/seo/*`
- `src/lib/cctv-*`

### PDF generation

- invoice
- receipt
- delivery
- warranty PDF

Main files:

- `src/lib/pdf/*`

### AI chat and consultation flow

- public chat sessions
- chat widget
- AI transport
- model selection
- AI usage tracking
- OpenAI / Gemini providers

Main files:

- `src/app/api/ai/*`
- `src/app/api/chat/*`
- `src/app/api/public/chat/*`
- `src/components/chat/*`
- `src/lib/ai/*`

Reason:

- user confirmed this is a real product feature
- consultation flow is part of the website experience
- should be stabilized, not removed

### Telegram and notification flow

- Telegram webhook
- bot token validation
- notification sending
- chat transfer notifications
- quote / inquiry notifications
- reminder cron endpoints

Main files:

- `src/app/api/telegram/*`
- `src/app/api/notifications/*`
- `src/app/api/cron/*`
- `src/lib/notifications/telegram.ts`
- `src/app/api/public/chat/*`
- `src/app/api/public/inquiry/*`
- `src/app/api/public/quote-request/*`

Reason:

- user confirmed this is a real product feature
- it is tied to chat, quote, and inquiry workflows
- should be standardized and documented, not disabled

## Candidate To Disable Or Isolate

These areas add maintenance weight or are less critical than the main website, product, quote, AI, and notification flows. They should not be removed blindly, but they are stronger candidates for later isolation.

### Portal area

- portal auth
- downloads
- videos
- portal pages

Main files:

- `src/app/(website)/(frontend)/portal/*`
- `src/app/(admin)/admin/portal/*`
- `src/app/api/portal/*`
- `src/lib/portal-auth.ts`

Reason:

- separate audience and permissions
- can be restored later after core flows are stable

### Audit, SEO logs, test, and debug routes

- audit logs
- seo logs
- test routes
- debug routes
- backfill helpers

Main files:

- `src/app/(admin)/admin/audit/*`
- `src/app/(admin)/admin/seo-logs/*`
- `src/app/api/audit/*`
- `src/app/api/test/*`
- `src/app/api/debug/*`

Reason:

- useful for maintenance
- not part of the first customer-facing recovery target

## Suggested Cleanup Order

1. Stabilize public website, products, quotes, customers, auth, settings, and uploads.
2. Stabilize AI chat, Turnstile, Telegram notifications, and related public APIs.
3. Confirm admin customers / quotes / products still work after each cleanup step.
4. Review portal, guides, CMS pages, dashboard, calculators, and debug tooling.
5. Only after the above, simplify dependencies and scripts further.

## Current Recommendation

For the next round, focus only on these modules:

- public website
- products
- customers
- quotes
- auth
- settings
- uploads
- AI chat
- Telegram notifications

Portal, audit, seo logs, test routes, and debug routes can be treated as secondary until proven necessary.
