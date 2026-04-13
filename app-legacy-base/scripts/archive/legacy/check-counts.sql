SELECT 'customers', COUNT(*) FROM "customers"
UNION ALL
SELECT 'company_names', COUNT(*) FROM "company_names"
UNION ALL
SELECT 'contacts', COUNT(*) FROM "contacts"
UNION ALL
SELECT 'locations', COUNT(*) FROM "locations"
UNION ALL
SELECT 'quotes', COUNT(*) FROM "quotes";
