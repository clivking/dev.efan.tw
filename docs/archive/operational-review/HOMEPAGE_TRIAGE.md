# Homepage Triage

## Goal

Classify the homepage sections by business priority so we can simplify the homepage without losing the main sales story.

Current homepage source:

- `app-legacy-base/src/app/(website)/(frontend)/page.tsx`

Current section order:

1. hero
2. client logos
3. featured products
4. craftsmanship gallery
5. services section
6. features section
7. SEO card
8. CTA banner
9. FAQ section

## Must Keep

These sections are part of the core homepage conversion story and should remain highly visible.

### Hero

Source:

- `app-legacy-base/src/components/home/HeroSection.tsx`

Reason:

- first impression
- company positioning
- strongest opening CTA

### Featured Products

Source:

- `app-legacy-base/src/components/home/FeaturedProducts.tsx`

Reason:

- directly connects homepage traffic to the product catalog
- supports product-led navigation and quote flow

### Services Section

Source:

- `app-legacy-base/src/components/home/ServicesSection.tsx`

Reason:

- explains the business offering clearly
- supports the top navigation structure

### CTA Banner

Source:

- `app-legacy-base/src/components/home/CTABanner.tsx`

Reason:

- explicit conversion block
- reinforces quote request and phone contact

## Keep But Can Shrink

These sections add trust or context, but they do not need to dominate the homepage.

### Client Logos

Source:

- `app-legacy-base/src/components/home/ClientLogos.tsx`

Reason:

- social proof
- useful, but can be visually lighter if the homepage feels too long

### Features Section

Source:

- `app-legacy-base/src/components/home/FeaturesSection.tsx`

Reason:

- trust and differentiation
- currently valuable, but can be condensed if needed

### FAQ Section

Source:

- `app-legacy-base/src/components/home/FAQSection.tsx`

Reason:

- helps with objections and SEO
- can be shorter or partially moved to guide/support pages later

## Keep For SEO Or Brand Depth

These sections add brand richness or SEO depth, but they are less essential to the immediate conversion path.

### Craftsmanship Gallery

Source:

- `app-legacy-base/src/components/home/CraftsmanshipGallery.tsx`

Reason:

- visually supports installation quality
- useful for trust, but not the first conversion-critical section

### SEO Card

Source:

- `app-legacy-base/src/components/home/SEOCard.tsx`

Reason:

- pushes users into solution landing pages
- useful for SEO and expansion paths
- can be repositioned or simplified without harming the main homepage story

## Recommended Priority Order

If the homepage needs to be shortened, keep this order strongest:

1. hero
2. featured products
3. services section
4. CTA banner
5. features section
6. client logos
7. FAQ
8. craftsmanship gallery
9. SEO card

## Current Recommendation

For the next homepage cleanup pass:

- keep hero, featured products, services, and CTA banner untouched in priority
- keep features, client logos, and FAQ, but allow them to be reduced
- keep craftsmanship gallery and SEO card, but treat them as flexible sections rather than fixed homepage anchors
