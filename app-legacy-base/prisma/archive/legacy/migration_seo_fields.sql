-- Phase 17.5 — 產品管理升級 DB Migration
-- 日期：2026-03-16

-- ===== Products: 新增 7 個欄位 =====
ALTER TABLE products ADD COLUMN IF NOT EXISTS show_on_website BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_quick_access BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255) NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_slug VARCHAR(255) NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_keywords VARCHAR(500) NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS website_description TEXT NULL;

-- ===== Product Categories: 新增 4 個欄位 =====
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS show_on_website BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255) NULL;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS seo_description TEXT NULL;
ALTER TABLE product_categories ADD COLUMN IF NOT EXISTS seo_slug VARCHAR(255) NULL;

-- ===== Uploaded Files: 新增 sort_order =====
ALTER TABLE uploaded_files ADD COLUMN IF NOT EXISTS sort_order INT NOT NULL DEFAULT 0;

-- ===== 唯一索引 =====
CREATE UNIQUE INDEX IF NOT EXISTS products_seo_slug_key ON products(seo_slug);
CREATE UNIQUE INDEX IF NOT EXISTS product_categories_seo_slug_key ON product_categories(seo_slug);

-- ===== 效能索引 =====
CREATE INDEX IF NOT EXISTS products_show_on_website_idx ON products(show_on_website);

-- ===== 分類 Seed（只更新空值）=====
UPDATE product_categories SET seo_slug = 'access-control', seo_title = '門禁系統｜一帆安全整合' WHERE name = '門禁' AND seo_slug IS NULL;
UPDATE product_categories SET seo_slug = 'cctv', seo_title = '監視系統｜一帆安全整合' WHERE name = '監視' AND seo_slug IS NULL;
UPDATE product_categories SET seo_slug = 'phone-system', seo_title = '電話總機系統｜一帆安全整合' WHERE name = '電話' AND seo_slug IS NULL;
UPDATE product_categories SET seo_slug = 'network', seo_title = '網路設備｜一帆安全整合' WHERE name = '網路' AND seo_slug IS NULL;
UPDATE product_categories SET seo_slug = 'other', seo_title = '其他設備｜一帆安全整合' WHERE name = '其他' AND seo_slug IS NULL;
