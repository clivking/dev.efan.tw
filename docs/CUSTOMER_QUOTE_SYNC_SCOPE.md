# Customer And Quote Sync Scope

## Goal

Define exactly what the Step 3 selective sync is allowed to move from `www` into `dev`.

This scope exists because `dev` also stores unreleased products and website content that must not be erased by a full production DB restore.

## Sync Categories

### Primary Sync Domain

These tables are the main `www -> dev` selective-sync target.

#### `customers`

Fields:

- `id`
- `customerNumber`
- `notes`
- `isDeleted`
- `createdAt`
- `updatedAt`
- `lastDealAt`
- `lastQuoteAt`
- `portalToken`
- `portalTokenExpires`

#### `company_names`

Fields:

- `id`
- `customerId`
- `companyName`
- `taxId`
- `isPrimary`
- `sortOrder`
- `createdAt`
- `updatedAt`

#### `contacts`

Fields:

- `id`
- `customerId`
- `name`
- `mobile`
- `phone`
- `fax`
- `email`
- `isPrimary`
- `notes`
- `sortOrder`
- `createdAt`
- `updatedAt`
- `title`
- `hasLine`

#### `locations`

Fields:

- `id`
- `customerId`
- `name`
- `address`
- `isPrimary`
- `notes`
- `sortOrder`
- `createdAt`
- `updatedAt`

#### `quotes`

Fields:

- `id`
- `quoteNumber`
- `customerId`
- `companyNameId`
- `locationId`
- `status`
- `taxRate`
- `subtotalAmount`
- `discountAmount`
- `discountNote`
- `totalAmount`
- `totalCost`
- `totalProfit`
- `taxCost`
- `actualProfit`
- `internalNote`
- `customerNote`
- `parentQuoteId`
- `isSuperseded`
- `templateId`
- `validUntil`
- `createdBy`
- `confirmedAt`
- `sentAt`
- `signedAt`
- `paidAt`
- `isDeleted`
- `createdAt`
- `updatedAt`
- `name`
- `hasTransportFee`
- `transportFee`
- `transportFeeCost`
- `nameEn`
- `completedAt`
- `constructionAt`
- `invoiceIssuedAt`
- `firstViewedAt`
- `selectedVariantId`
- `viewCount`
- `warrantyExpiresAt`
- `warrantyMonths`
- `warrantyStartDate`
- `warrantyNotifiedAt`
- `completion_note`
- `discountExpiryAt`
- `area`

#### `quote_items`

Fields:

- `id`
- `quoteId`
- `productId`
- `name`
- `description`
- `unit`
- `quantity`
- `unitPrice`
- `costPrice`
- `subtotal`
- `isHiddenItem`
- `internalNote`
- `customerNote`
- `sortOrder`
- `createdAt`
- `updatedAt`
- `variantId`

#### `quote_contacts`

Fields:

- `id`
- `quoteId`
- `contactId`
- `isPrimary`
- `createdAt`

#### `quote_tokens`

Fields:

- `id`
- `quoteId`
- `token`
- `isActive`
- `expiresAt`
- `createdBy`
- `createdAt`

#### `quote_views`

Fields:

- `id`
- `tokenId`
- `ipAddress`
- `userAgent`
- `deviceType`
- `durationSeconds`
- `createdAt`

#### `quote_signatures`

Fields:

- `id`
- `quoteId`
- `variantId`
- `signerName`
- `signerTitle`
- `signatureImage`
- `ipAddress`
- `userAgent`
- `signedAt`
- `createdAt`

#### `quote_variants`

Fields:

- `id`
- `quoteId`
- `name`
- `isRecommended`
- `subtotalAmount`
- `totalAmount`
- `totalCost`
- `sortOrder`
- `createdAt`
- `updatedAt`

#### `payments`

Fields:

- `id`
- `quoteId`
- `type`
- `amount`
- `method`
- `paidAt`
- `notes`
- `recordedBy`
- `createdAt`
- `updatedAt`

### Optional Secondary Sync Domain

These tables are related to customer and quote operations, but should be included only after confirming the business need and dependency impact:

- `contact_requests`
- `portal_users`
- `portal_downloads`
- `chat_sessions`
- `chat_messages`
- `notifications`

## Dependency Tables

These are dependencies of the quote domain, but they must not be blindly overwritten as part of Step 3:

- `products`
- `product_categories`
- `users`
- `quote_templates`
- `template_items`

### Dependency Rule

Before a selective sync is applied, verify that incoming records can still resolve required foreign keys against the current `dev` reference data.

Critical examples:

- `quote_items.productId` must not reference a missing `products.id`
- `quotes.createdBy` must not reference a missing `users.id`
- `quotes.templateId` must not reference a missing template if templates are still required by the quote workflow

If dependency checks fail:

- stop the sync
- do not partially apply quote-domain data
- reconcile the missing reference data first

## Explicit Non-Sync Domain For Step 3

These should stay owned by `dev` during the `www -> dev` selective sync:

- products
- product categories
- pages and website content records
- guides and similar editorial records
- settings under active development
- uploads metadata tied only to unreleased dev content

## Apply Order

When implementing the selective sync, apply tables in dependency-safe order.

Recommended order:

1. `customers`
2. `company_names`
3. `contacts`
4. `locations`
5. `quotes`
6. `quote_variants`
7. `quote_items`
8. `quote_contacts`
9. `quote_tokens`
10. `quote_views`
11. `quote_signatures`
12. `payments`

## Validation After Sync

Minimum checks:

1. customer counts look plausible
2. quote counts look plausible
3. sample customer records match `www`
4. sample quote records match `www`
5. quote items still resolve against product references in `dev`
6. `dev`-only unreleased products and pages still exist
