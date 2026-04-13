-- 清空客戶相關資料
DELETE FROM "quote_contacts";
DELETE FROM "quote_items";
DELETE FROM "quotes";
DELETE FROM "company_names";
DELETE FROM "contacts";
DELETE FROM "locations";
DELETE FROM "contact_requests";
DELETE FROM "customers";
DELETE FROM "daily_counters" WHERE "type" = 'CUSTOMER';
