# Website Surface Inventory

## Goal

Track the public-facing surface area that is currently exposed through:

- header navigation
- mobile navigation
- homepage
- footer

This is the fastest way to decide what users actually see first, regardless of how many routes exist in the codebase.

## Primary Public Entry Points

These are the highest-priority public-facing areas because they appear in navigation, homepage sections, or strong CTA positions.

### Products

Appears in:

- desktop header mega menu
- mobile navigation
- homepage featured products
- quote CTA path

Main routes:

- `/products`
- `/products/category/[slug]`
- product detail pages

Importance:

- top-level navigation item
- directly tied to inquiry and quote flow

### Services

Appears in:

- desktop header dropdown
- mobile navigation
- homepage services section
- footer services links

Main routes:

- `/services/access-control`
- `/services/cctv`
- `/services/phone-system`
- `/services/attendance`
- `/services/integration`

Importance:

- top-level navigation item
- core business positioning

### Quote Request

Appears in:

- desktop header CTA
- mobile CTA
- product menu CTA
- homepage hero CTA
- CTA banner
- footer CTA

Main route:

- `/quote-request`

Importance:

- strongest conversion path on the site
- must remain highly visible

### Guides / Resource Center

Appears in:

- desktop header resource menu
- mobile navigation
- footer guides links

Main routes:

- `/guides`
- selected guide detail pages

Related support entries surfaced beside guides:

- `/tools/cctv-storage-calculator`
- `/support/downloads`
- `/portal`

Importance:

- content marketing and SEO surface
- resource menu currently mixes guides, tools, downloads, and portal

### About / Contact

Appears in:

- desktop about dropdown
- mobile about links
- footer contact block

Main routes:

- `/about`
- `/about/clients`
- `/contact`

Importance:

- trust and company identity
- supports contact conversion

## Homepage Surface

The current homepage is built from these sections in order:

1. hero
2. client logos
3. featured products
4. craftsmanship gallery
5. services section
6. features section
7. SEO card
8. CTA banner
9. FAQ section

Main source:

- `app-legacy-base/src/app/(website)/(frontend)/page.tsx`

## Footer Surface

The current footer exposes:

- company info
- services links
- guide links
- location SEO links
- phone CTA
- privacy
- terms

This means the footer is not just utility navigation. It is also carrying SEO and conversion weight.

## Recommended Keep Order

If we must simplify the visible public surface, preserve these first:

1. products
2. quote request
3. services
4. contact / about
5. guides
6. support downloads and calculators
7. portal

## Current Recommendation

For the next cleanup phase, treat these as first-line public surface and keep them stable:

- products
- services
- quote request
- guides
- contact
- about
- homepage core sections
- footer company and CTA blocks

Treat these as second-line surface that can be reorganized later without breaking the site's main story:

- portal
- location SEO links
- support downloads
- calculator links
