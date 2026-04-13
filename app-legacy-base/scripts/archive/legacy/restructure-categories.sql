-- Category Restructuring Script
-- Run inside efan-postgres container

BEGIN;

-- ========================================
-- 1. Create top-level 「門口對講機」
-- ========================================
INSERT INTO product_categories (id, name, sort_order, show_on_website, seo_slug, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    '門口對講機',
    2,  -- after 監視(1), before 電話
    true,
    'video-intercom',
    NOW(), NOW()
);

-- Get the new parent id
-- (We'll use a variable approach with DO block)

DO $$
DECLARE
    v_intercom_parent_id UUID;
    v_video_intercom_id UUID;
    v_voice_intercom_id UUID;
    v_old_intercom_id UUID := '47b307a1-13ec-4bda-a903-6d62f08f2b58';
    v_access_control_id UUID := 'f7cdce35-58a9-42db-9e3b-011940dec27a';
    v_phone_id UUID := 'f656b6a7-ed39-4d7d-9800-ee60b3c2b9c1';
    v_pbx_id UUID := '477b0741-4fa0-482b-b168-ca0ead28b500';
    v_surveillance_id UUID := '00c60376-9dc3-4a3c-896a-89eb2d63f7d3';
    v_accessories_id UUID;
    v_tongxun_id UUID;
    v_nec_id UUID;
    v_sv_accessories_id UUID;
BEGIN
    -- Get the new parent
    SELECT id INTO v_intercom_parent_id FROM product_categories WHERE seo_slug = 'video-intercom' AND parent_id IS NULL;

    -- ========================================
    -- 2. Create 「影像門口對講機」 child
    -- ========================================
    v_video_intercom_id := gen_random_uuid();
    INSERT INTO product_categories (id, name, parent_id, sort_order, show_on_website, seo_slug, created_at, updated_at)
    VALUES (v_video_intercom_id, '影像門口對講機', v_intercom_parent_id, 0, true, 'video-door-phone', NOW(), NOW());

    -- ========================================
    -- 3. Create 「語音門口對講機」 child (empty for now)
    -- ========================================
    v_voice_intercom_id := gen_random_uuid();
    INSERT INTO product_categories (id, name, parent_id, sort_order, show_on_website, seo_slug, created_at, updated_at)
    VALUES (v_voice_intercom_id, '語音門口對講機', v_intercom_parent_id, 1, true, 'audio-door-phone', NOW(), NOW());

    -- ========================================
    -- 4. Move all products from old 對講機 → 影像門口對講機
    -- ========================================
    UPDATE products SET category_id = v_video_intercom_id, updated_at = NOW()
    WHERE category_id = v_old_intercom_id;

    -- ========================================
    -- 5. Delete old 對講機 category (now empty)
    -- ========================================
    DELETE FROM product_categories WHERE id = v_old_intercom_id;

    -- ========================================
    -- 6. Create 「相關配件」 under 門禁 (merge 3 categories)
    -- ========================================
    v_accessories_id := gen_random_uuid();
    INSERT INTO product_categories (id, name, parent_id, sort_order, show_on_website, seo_slug, created_at, updated_at)
    VALUES (v_accessories_id, '相關配件', v_access_control_id, 4, true, 'access-accessories', NOW(), NOW());

    -- Move products from 電源供應器 → 相關配件
    UPDATE products SET category_id = v_accessories_id, updated_at = NOW()
    WHERE category_id = 'f5470bf7-cf09-47cd-8b6a-afd7128f1036';  -- power-supply

    -- Move products from 感應卡/鑰匙圈 → 相關配件
    UPDATE products SET category_id = v_accessories_id, updated_at = NOW()
    WHERE category_id = 'a6b2ea9c-bc98-4a59-a125-02724e31815a';  -- rfid-tag

    -- Move products from 門鎖配件 → 相關配件
    UPDATE products SET category_id = v_accessories_id, updated_at = NOW()
    WHERE category_id = '9d2a9666-e8ef-4d9c-9d1a-539b49e267ce';  -- lock-accessories

    -- Delete the 3 now-empty categories
    DELETE FROM product_categories WHERE id IN (
        'f5470bf7-cf09-47cd-8b6a-afd7128f1036',  -- 電源供應器
        'a6b2ea9c-bc98-4a59-a125-02724e31815a',   -- 感應卡/鑰匙圈
        '9d2a9666-e8ef-4d9c-9d1a-539b49e267ce'    -- 門鎖配件
    );

    -- Also delete 五金 and 工資 (internal categories, not shown)
    DELETE FROM product_categories WHERE id IN (
        'a75452c1-8633-416d-852e-8e9994e498cf',  -- 五金
        '7583b0aa-42c5-4c83-8eb7-eb6b7021c3c5'   -- 工資
    );

    -- ========================================
    -- 7. Rename categories
    -- ========================================
    -- 讀卡機 → 門禁讀卡機
    UPDATE product_categories SET name = '門禁讀卡機', updated_at = NOW()
    WHERE id = '7443f8cb-51e6-44ea-8f6f-d3e03e0c0e7c';

    -- 通訊模組 → 連線模組
    UPDATE product_categories SET name = '連線模組', updated_at = NOW()
    WHERE id = 'ca5da4e0-ed7d-4d61-aee0-7cbb2291a5a6';

    -- ========================================
    -- 8. Reorder 門禁 subcategories
    -- ========================================
    -- 門禁讀卡機=0, 電子鎖=1, 開門按鈕=2, 連線模組=3, 相關配件=4
    UPDATE product_categories SET sort_order = 0 WHERE id = '7443f8cb-51e6-44ea-8f6f-d3e03e0c0e7c'; -- 門禁讀卡機
    UPDATE product_categories SET sort_order = 1 WHERE id = 'f8061f58-8b0e-4c8b-a7dd-7244ed8047aa'; -- 電子鎖
    UPDATE product_categories SET sort_order = 2 WHERE id = 'd651d75a-5075-43db-a7ad-74462ca72e19'; -- 開門按鈕
    UPDATE product_categories SET sort_order = 3 WHERE id = 'ca5da4e0-ed7d-4d61-aee0-7cbb2291a5a6'; -- 連線模組
    UPDATE product_categories SET sort_order = 4 WHERE seo_slug = 'access-accessories';              -- 相關配件

    -- ========================================
    -- 9. 電話總機拆分：東訊 / NEC
    -- ========================================
    v_tongxun_id := gen_random_uuid();
    INSERT INTO product_categories (id, name, parent_id, sort_order, show_on_website, seo_slug, created_at, updated_at)
    VALUES (v_tongxun_id, '東訊電話總機', v_phone_id, 0, true, 'tecom-pbx', NOW(), NOW());

    v_nec_id := gen_random_uuid();
    INSERT INTO product_categories (id, name, parent_id, sort_order, show_on_website, seo_slug, created_at, updated_at)
    VALUES (v_nec_id, 'NEC 電話總機', v_phone_id, 1, true, 'nec-pbx', NOW(), NOW());

    -- Move all TECOM products from 電話總機 → 東訊電話總機
    UPDATE products SET category_id = v_tongxun_id, updated_at = NOW()
    WHERE category_id = v_pbx_id;

    -- Delete old 電話總機 child category (now empty)
    DELETE FROM product_categories WHERE id = v_pbx_id;

    -- ========================================
    -- 10. 監視錄影 新增「相關配件」
    -- ========================================
    v_sv_accessories_id := gen_random_uuid();
    INSERT INTO product_categories (id, name, parent_id, sort_order, show_on_website, seo_slug, created_at, updated_at)
    VALUES (v_sv_accessories_id, '相關配件', v_surveillance_id, 2, true, 'surveillance-accessories', NOW(), NOW());

    -- ========================================
    -- 11. Reorder top-level categories
    -- ========================================
    -- 門禁=0, 監視=1, 門口對講機=2, 電話=3, 網路=4, 其他=5
    UPDATE product_categories SET sort_order = 0 WHERE id = v_access_control_id;
    UPDATE product_categories SET sort_order = 1 WHERE id = v_surveillance_id;
    UPDATE product_categories SET sort_order = 2 WHERE id = v_intercom_parent_id;
    UPDATE product_categories SET sort_order = 3 WHERE id = v_phone_id;
    UPDATE product_categories SET sort_order = 4 WHERE id = 'b3e05fb4-6d1e-449e-bda4-cdc879f9cfca'; -- 網路
    UPDATE product_categories SET sort_order = 5 WHERE id = '9fac3232-c11e-4a21-a2c7-6bf04996e7b7'; -- 其他

    RAISE NOTICE 'Category restructuring complete!';
    RAISE NOTICE 'New 門口對講機 parent ID: %', v_intercom_parent_id;
    RAISE NOTICE 'New 影像門口對講機 ID: %', v_video_intercom_id;
    RAISE NOTICE 'New 相關配件 (門禁) ID: %', v_accessories_id;
    RAISE NOTICE 'New 東訊電話總機 ID: %', v_tongxun_id;
    RAISE NOTICE 'New NEC 電話總機 ID: %', v_nec_id;
END $$;

COMMIT;
