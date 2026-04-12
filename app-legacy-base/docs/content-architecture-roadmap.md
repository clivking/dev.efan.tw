# Content Architecture Roadmap

## Goal

Build an efan content system that supports:

- SEO-first landing pages
- GEO-ready area and service coverage
- AI overview / AEO-friendly guide content
- Codex-first editing as the primary production workflow

## Current State

- `Page` is optimized for structured frontend pages with `sections` and optional `richContent`.
- `GuideArticle` is optimized for long-form knowledge content with keyword, intent, FAQ, and relationship fields.
- These should remain separate content types.

## Direction

Do not merge `Page` and `GuideArticle` into one table or one universal editor.

Instead:

1. Share a common content metadata contract.
2. Keep page-specific and guide-specific editors separate.
3. Build reusable content entities that both content types can reference.
4. Move strategic content toward repo-first authoring over time.

## Phase 1

Implemented in this phase:

- Shared metadata helper: [src/lib/content-metadata.ts](/home/dev/projects/efan.tw/web/src/lib/content-metadata.ts)
- Shared admin metadata section: [src/components/admin/ContentMetadataSection.tsx](/home/dev/projects/efan.tw/web/src/components/admin/ContentMetadataSection.tsx)
- Guide editor now uses the shared metadata section.
- Page editor now uses the shared metadata section.

Outcome:

- SEO title and description handling now follows one admin pattern.
- Guide metadata is closer to a reusable contract instead of ad hoc form-only fields.

## Phase 2

Next schema work should add a shared content metadata layer for page-like and guide-like content:

- `excerpt`
- `targetKeyword`
- `secondaryKeywords`
- `searchIntent`
- `seoTitle`
- `seoDescription`
- `ogImage`
- `reviewedAt`
- `canonicalOverride`
- `schemaType`
- `primaryEntityId`
- `geoTargets`

Suggested rule:

- Keep `Page` and `GuideArticle` separate tables.
- Add shared fields only where they improve search, schema, or Codex editing workflows.

## Phase 3

Introduce reusable entity references:

- service
- location
- product
- faq block
- proof / case study
- comparison block

This allows:

- service pages to reuse verified facts
- guides to link back to commercial pages
- internal linking and schema generation to stay consistent

## Phase 4

Move strategic content creation to repo-first files for Codex-driven editing:

- `content/pages/*.mdx|json`
- `content/guides/*.mdx`
- `content/entities/*.json`

Admin should remain for:

- publish status
- redirect status
- media references
- sort order
- lightweight overrides

## Operating Rules

- `Page` exists to rank and convert.
- `GuideArticle` exists to explain, compare, and earn citation.
- Shared SEO logic belongs in code, not duplicated across editors.
- High-value content should be easy for Codex to patch with normal diffs and review.

## Recommendation

For efan, the long-term best architecture is:

- separate content types
- shared metadata contract
- shared entity graph
- repo-first strategic authoring
- admin as management, not the sole authoring surface
