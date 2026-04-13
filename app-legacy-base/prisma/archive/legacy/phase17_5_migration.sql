-- Phase 17.5: Product SEO & Website Display fields
DO $$ BEGIN
  -- Products table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='show_on_website') THEN
    ALTER TABLE products ADD COLUMN show_on_website BOOLEAN NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='seo_title') THEN
    ALTER TABLE products ADD COLUMN seo_title VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='seo_description') THEN
    ALTER TABLE products ADD COLUMN seo_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='seo_slug') THEN
    ALTER TABLE products ADD COLUMN seo_slug VARCHAR(255);
    CREATE UNIQUE INDEX products_seo_slug_key ON products(seo_slug);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='seo_keywords') THEN
    ALTER TABLE products ADD COLUMN seo_keywords VARCHAR(500);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='website_description') THEN
    ALTER TABLE products ADD COLUMN website_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='is_quick_access') THEN
    ALTER TABLE products ADD COLUMN is_quick_access BOOLEAN NOT NULL DEFAULT false;
  END IF;
  -- Index on show_on_website
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename='products' AND indexname='products_show_on_website_idx') THEN
    CREATE INDEX products_show_on_website_idx ON products(show_on_website);
  END IF;

  -- Product categories table
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_categories' AND column_name='show_on_website') THEN
    ALTER TABLE product_categories ADD COLUMN show_on_website BOOLEAN NOT NULL DEFAULT true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_categories' AND column_name='seo_title') THEN
    ALTER TABLE product_categories ADD COLUMN seo_title VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_categories' AND column_name='seo_description') THEN
    ALTER TABLE product_categories ADD COLUMN seo_description TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='product_categories' AND column_name='seo_slug') THEN
    ALTER TABLE product_categories ADD COLUMN seo_slug VARCHAR(255);
    CREATE UNIQUE INDEX product_categories_seo_slug_key ON product_categories(seo_slug);
  END IF;

  -- Uploaded files sort_order
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='uploaded_files' AND column_name='sort_order') THEN
    ALTER TABLE uploaded_files ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Seed category slugs (only if not already set)
UPDATE product_categories SET seo_slug = 'access-control' WHERE name = '門禁' AND seo_slug IS NULL;
UPDATE product_categories SET seo_slug = 'cctv' WHERE name = '監視' AND seo_slug IS NULL;
UPDATE product_categories SET seo_slug = 'phone-system' WHERE name = '電話' AND seo_slug IS NULL;
UPDATE product_categories SET seo_slug = 'network' WHERE name = '網路' AND seo_slug IS NULL;
UPDATE product_categories SET seo_slug = 'other' WHERE name = '其他' AND seo_slug IS NULL;
