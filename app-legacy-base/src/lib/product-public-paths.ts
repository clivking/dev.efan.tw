import { prisma } from '@/lib/prisma';

export async function getProductPublicPaths(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      seoSlug: true,
      category: {
        select: {
          seoSlug: true,
          parent: {
            select: {
              seoSlug: true,
            },
          },
        },
      },
    },
  });

  if (!product) {
    return { productSlug: null, categorySlugs: [] as string[] };
  }

  const categorySlugs = [
    product.category?.seoSlug,
    product.category?.parent?.seoSlug,
  ].filter((slug): slug is string => Boolean(slug));

  return {
    productSlug: product.seoSlug,
    categorySlugs,
  };
}
