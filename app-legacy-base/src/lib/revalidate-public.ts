import { revalidatePath, revalidateTag } from 'next/cache';

type ProductRevalidateOptions = {
  productSlug?: string | null;
  categorySlugs?: Array<string | null | undefined>;
};

export function revalidateCompanyData() {
  revalidateTag('company', 'max');
  revalidatePath('/');
  revalidatePath('/about');
  revalidatePath('/contact');
  revalidatePath('/products');
}

export function revalidateProductSite(options: ProductRevalidateOptions = {}) {
  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath('/products/inquiry');

  for (const slug of options.categorySlugs || []) {
    if (slug) revalidatePath(`/products/category/${slug}`);
  }

  if (options.productSlug) {
    revalidatePath(`/products/${options.productSlug}`);
  }
}
