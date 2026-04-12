import { prisma } from '@/lib/prisma';

export interface FilterableSpec {
    key: string;
    options: string[];
}

export interface CategoryChild {
    id: string;
    name: string;
    slug: string;
    productCount: number;
    filterableSpecs: FilterableSpec[];
}

export interface CategoryTree {
    id: string;
    name: string;
    displayName: string;
    slug: string;
    productCount: number;
    children: CategoryChild[];
    filterableSpecs: FilterableSpec[];
}

/**
 * Display names for top-level categories.
 * Backend names are short; frontend needs more descriptive names.
 */
const CATEGORY_DISPLAY_MAP: Record<string, string> = {
    '門禁': '門禁系統',
    '監視': '監視錄影',
    '門口對講機': '門口對講機',
    '電話': '電話總機',
    '網路': '網路設備',
    '其他': '其他設備',
};

function getDisplayName(name: string): string {
    return CATEGORY_DISPLAY_MAP[name] || name;
}

/**
 * Extract filterable specs from a specTemplate JSON.
 * Only includes fields with type:"select" AND filterable:true.
 * Options are deduplicated and sorted.
 */
function extractFilterableSpecs(specTemplate: any): FilterableSpec[] {
    if (!specTemplate || !Array.isArray(specTemplate)) return [];
    const specs: FilterableSpec[] = [];
    for (const group of specTemplate) {
        for (const field of (group.fields || [])) {
            if (field.type === 'select' && field.filterable && Array.isArray(field.options) && field.options.length > 0) {
                specs.push({
                    key: field.key,
                    options: [...new Set<string>(field.options)].sort(),
                });
            }
        }
    }
    return specs;
}

/**
 * Fetch nested category tree for frontend navigation.
 * Server-side only — used in layout.tsx to pass as prop to Header.
 * Only returns categories with showOnWebsite=true that have visible products.
 */
export async function getCategoryTree(): Promise<CategoryTree[]> {
  try {

    const allCategories = await prisma.productCategory.findMany({
        where: { showOnWebsite: true },
        select: {
            id: true,
            name: true,
            sortOrder: true,
            parentId: true,
            seoSlug: true,
            specTemplate: true,
            _count: {
                select: {
                    products: {
                        where: { isDeleted: false, isHiddenItem: false, showOnWebsite: true },
                    },
                },
            },
        },
        orderBy: { sortOrder: 'asc' },
    });

    const topLevel = allCategories.filter(c => !c.parentId);
    const childrenMap = new Map<string, typeof allCategories>();
    for (const cat of allCategories) {
        if (cat.parentId) {
            if (!childrenMap.has(cat.parentId)) childrenMap.set(cat.parentId, []);
            childrenMap.get(cat.parentId)!.push(cat);
        }
    }

    return topLevel
        .map(parent => {
            const parentFilterable = extractFilterableSpecs(parent.specTemplate);

            const children = (childrenMap.get(parent.id) || [])
                .filter(c => c._count.products > 0)
                .map(c => {
                    // Inheritance: null/undefined → inherit parent; [] → intentionally no filter
                    const childTemplate = c.specTemplate;
                    let childFilterable: FilterableSpec[];
                    if (childTemplate === null || childTemplate === undefined) {
                        childFilterable = parentFilterable;
                    } else {
                        childFilterable = extractFilterableSpecs(childTemplate);
                    }

                    return {
                        id: c.id,
                        name: c.name,
                        slug: c.seoSlug || c.id,
                        productCount: c._count.products,
                        filterableSpecs: childFilterable,
                    };
                });

            const totalProductCount = parent._count.products + children.reduce((sum, c) => sum + c.productCount, 0);

            return {
                id: parent.id,
                name: parent.name,
                displayName: getDisplayName(parent.name),
                slug: parent.seoSlug || parent.id,
                productCount: totalProductCount,
                children,
                filterableSpecs: parentFilterable,
            };
        })
        .filter(c => c.productCount > 0 || c.children.length > 0);
  } catch {
    return [];
  }
}
