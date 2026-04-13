ALTER TABLE quote_templates
    ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS discount_note TEXT,
    ADD COLUMN IF NOT EXISTS has_transport_fee BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS transport_fee DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS transport_fee_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS internal_note TEXT,
    ADD COLUMN IF NOT EXISTS customer_note TEXT,
    ADD COLUMN IF NOT EXISTS warranty_months INTEGER;

ALTER TABLE template_items
    ALTER COLUMN product_id DROP NOT NULL;

ALTER TABLE template_items
    ADD COLUMN IF NOT EXISTS name TEXT,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS unit TEXT,
    ADD COLUMN IF NOT EXISTS unit_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_hidden_item BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS internal_note TEXT,
    ADD COLUMN IF NOT EXISTS customer_note TEXT,
    ADD COLUMN IF NOT EXISTS variant_source_id UUID;

UPDATE template_items ti
SET
    name = COALESCE(ti.name, p.quote_name, p.name, 'Untitled Item'),
    description = COALESCE(ti.description, p.quote_desc, p.description),
    unit = COALESCE(ti.unit, p.unit),
    unit_price = COALESCE(NULLIF(ti.unit_price, 0), p.selling_price, 0),
    cost_price = COALESCE(NULLIF(ti.cost_price, 0), p.cost_price, 0),
    is_hidden_item = COALESCE(ti.is_hidden_item, p.is_hidden_item, FALSE)
FROM products p
WHERE ti.product_id = p.id;

UPDATE template_items
SET name = COALESCE(name, 'Untitled Item')
WHERE name IS NULL;

ALTER TABLE template_items
    ALTER COLUMN name SET NOT NULL;
