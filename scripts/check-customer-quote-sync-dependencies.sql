-- Validate whether quote-domain rows from the current DB can still resolve
-- against dependency tables that are intentionally not part of Step 3 sync.

\echo 'Missing products referenced by quote_items'
SELECT qi.id AS quote_item_id, qi.quote_id, qi.product_id
FROM quote_items qi
LEFT JOIN products p ON p.id = qi.product_id
WHERE qi.product_id IS NOT NULL
  AND p.id IS NULL
ORDER BY qi.created_at DESC;

\echo 'Missing users referenced by quotes.created_by'
SELECT q.id AS quote_id, q.quote_number, q.created_by
FROM quotes q
LEFT JOIN users u ON u.id = q.created_by
WHERE u.id IS NULL
ORDER BY q.created_at DESC;

\echo 'Missing templates referenced by quotes.template_id'
SELECT q.id AS quote_id, q.quote_number, q.template_id
FROM quotes q
LEFT JOIN quote_templates qt ON qt.id = q.template_id
WHERE q.template_id IS NOT NULL
  AND qt.id IS NULL
ORDER BY q.created_at DESC;

\echo 'Missing variants referenced by quotes.selected_variant_id'
SELECT q.id AS quote_id, q.quote_number, q.selected_variant_id
FROM quotes q
LEFT JOIN quote_variants qv ON qv.id = q.selected_variant_id
WHERE q.selected_variant_id IS NOT NULL
  AND qv.id IS NULL
ORDER BY q.created_at DESC;
