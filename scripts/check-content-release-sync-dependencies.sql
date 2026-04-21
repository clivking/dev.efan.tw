\echo 'Missing categories referenced by products'
SELECT p.id AS product_id, p.name, p.category_id
FROM products p
LEFT JOIN product_categories pc ON pc.id = p.category_id
WHERE pc.id IS NULL
ORDER BY p.updated_at DESC;
