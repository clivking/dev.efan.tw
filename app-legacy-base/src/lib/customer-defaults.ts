interface CustomerEntity {
    id: string;
    isPrimary?: boolean | null;
    sortOrder?: number | null;
}

interface CustomerWithDefaults {
    customerNumber?: string | null;
    companyNames?: CustomerEntity[];
    contacts?: CustomerEntity[];
    locations?: CustomerEntity[];
}

function sortByPrimaryThenOrder<T extends CustomerEntity>(items: T[] = []) {
    return [...items].sort((a, b) => {
        const primaryDiff = Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary));
        if (primaryDiff !== 0) return primaryDiff;
        return Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0);
    });
}

export function pickPrimaryOrFirst<T extends CustomerEntity>(items: T[] = []): T | null {
    const sorted = sortByPrimaryThenOrder(items);
    return sorted[0] ?? null;
}

export function resolveCustomerQuoteDefaults(customer: CustomerWithDefaults | null | undefined) {
    const companies = sortByPrimaryThenOrder(customer?.companyNames ?? []);
    const contacts = sortByPrimaryThenOrder(customer?.contacts ?? []);
    const locations = sortByPrimaryThenOrder(customer?.locations ?? []);

    return {
        defaultCompanyNameId: companies[0]?.id ?? null,
        defaultContactId: contacts[0]?.id ?? null,
        defaultContactIds: contacts[0] ? [contacts[0].id] : [],
        defaultLocationId: locations[0]?.id ?? null,
    };
}
