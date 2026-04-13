# Rebuild Import Sequence

## Goal

Move back to the new project baseline and import only the parts that are worth keeping.

## Phase 1

Stabilize the clean baseline.

Done:

- new app baseline
- local Docker runtime
- `dev.efan.tw`
- old DB isolation
- old app isolation
- old upload asset recovery

## Phase 2

Import content and assets, not legacy behavior.

Recommended order:

1. static public assets
2. product images and files
3. product content
4. company profile content
5. customer and quote data model decisions

## Phase 3

Rebuild business features in the new app.

Recommended order:

1. products
2. inquiry flow
3. contact flow
4. customer records
5. quotation workflow

## Phase 4

Rebuild skills from scratch after the app flow is stable.

Rules:

- keep the list small
- write only what the new project actually needs
- do not carry old skill clutter forward

## Immediate Next Step

Start with the new app and define the first import target:

- `products`

Reason:

- we already recovered product data and product images
- this gives the fastest visible progress in the new project

## Current Path Chosen

We are using a controlled working copy based on the recovered old site:

- code: `app-legacy-base`
- runtime: `efan-work-app` and `efan-work-db`

This means:

- we can keep moving quickly from a familiar baseline
- we still preserve `code-old` as untouched reference material
- cleanup and refactor work now happens in the working copy, not in the recovery snapshot
