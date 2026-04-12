# Product Image Debug Notes

## Scope

This note records product image failure patterns found on the efan website, especially for:

- product detail main gallery
- product detail thumbnails
- related product cards
- product listing cards

## Key Finding

A product image can fail even when the original file is healthy.

In this project, the original uploaded asset under `/api/uploads/products/...` may return `200 OK`, while the Next.js optimizer route `/_next/image?...` can still fail and produce a broken image in the UI.

That means:

- a broken image does not automatically mean the file is missing
- the first check should separate "origin file broken" from "image optimizer broken"

## Fast Triage Order

When a product image is broken, check in this order:

1. Inspect the page HTML and find the actual `img src` or `srcset`.
2. Check whether the original file URL under `/api/uploads/products/...` returns `200`.
3. Check whether the corresponding `/_next/image?...` URL returns `200` or `400`.
4. Confirm whether the failing page is:
   - homepage product card
   - category/product listing card
   - product detail main gallery
   - product detail thumbnail strip
   - related product card
5. Verify whether the page is using relative image paths or absolute site URLs.

## Important Project-Specific Behavior

For this project:

- homepage cards and some listing cards may work with relative paths like `/api/uploads/products/...`
- product detail pages previously converted gallery image paths into absolute URLs like `https://dev.efan.tw/api/uploads/...`
- this made the image pipeline more fragile
- even after switching back to relative paths, the detail page could still fail if `/_next/image` itself was the broken layer

## Safe Fallback Strategy

If product detail images are failing and the original `/api/uploads/products/...` files are healthy:

- do not keep forcing the issue through `next/image`
- prefer a direct image fallback for the product detail gallery
- keep SEO/schema image URLs absolute if needed
- keep visual rendering URLs simple and stable

In practice, a plain `<img>` for the detail gallery is an acceptable recovery path when reliability matters more than optimizer features.

## Do Not Assume Shared Behavior

Do not assume these views behave the same:

- homepage featured products
- product category pages
- product detail gallery
- related product cards

They may use different components and different image URL transformations.

Always test each path separately.

## Verification Checklist

After any image-related fix:

1. Open at least one affected product detail page.
2. Confirm the main image renders.
3. Confirm thumbnail images render.
4. Confirm clicking thumbnails changes the main image.
5. Confirm the lightbox still works if present.
6. Confirm one related product card still renders correctly.
7. Confirm the original image URL returns `200`.
8. If `next/image` is still used, confirm the generated `/_next/image` URL also returns `200`.

## Example Case

Observed product:

- `/products/soyal-ar-721-h`

Observed file:

- `/api/uploads/products/14160a1b-f359-4330-b3a1-bc3fbc61b0a3.png`

Observed behavior:

- original file returned `200 OK`
- detail page image rendered broken
- generated `/_next/image?...` requests failed
- stable fix was to bypass optimizer behavior for the detail gallery rendering path

## Rule Of Thumb

If the browser can load `/api/uploads/products/...` directly but the page still shows a broken image, suspect the rendering pipeline before suspecting the file itself.
