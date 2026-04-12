/**
 * Phase 4 product management acceptance script
 */
const BASE = 'http://localhost:3001';
let cookie = '';
let passed = 0;
let failed = 0;

async function login() {
    for (const cred of [
        { username: 'cliv', password: '0982' },
        { username: 'boss', password: 'boss123' },
    ]) {
        const res = await fetch(BASE + '/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cred),
        });

        if (res.ok) {
            const data = await res.json();
            if (data.token) {
                cookie = 'token=' + data.token;
                console.log('   \u4f7f\u7528\u5e33\u865f: ' + cred.username);
                return;
            }
        }
    }

    throw new Error('Login failed - no token returned');
}

function headers() {
    return {
        'Content-Type': 'application/json',
        Cookie: cookie,
    };
}

async function test(name, fn) {
    try {
        const result = await fn();
        console.log('
PASS: ' + name);
        if (result) console.log('   ' + result);
        passed++;
    } catch (error) {
        console.log('
FAIL: ' + name);
        console.log('   ' + error.message);
        failed++;
    }
}

async function main() {
    console.log('========================================');
    console.log('  Phase 4 product management acceptance');
    console.log('========================================');

    await login();
    console.log('Login OK');

    let categoryId;
    await test('1. GET /api/products/categories should return core categories and productCount', async () => {
        const res = await fetch(BASE + '/api/products/categories', { headers: headers() });
        const data = await res.json();
        if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + JSON.stringify(data));
        if (!data.categories || data.categories.length < 5) {
            throw new Error('Expected at least 5 categories, got ' + data.categories?.length);
        }

        const expectedNames = ['\u9580\u7981', '\u76e3\u8996', '\u96fb\u8a71', '\u7db2\u8def', '\u5176\u4ed6'];
        const names = data.categories.map((item) => item.name);
        for (const expected of expectedNames) {
            if (!names.includes(expected)) throw new Error('Missing category: ' + expected);
        }
        for (const category of data.categories) {
            if (category.productCount === undefined) {
                throw new Error('Missing productCount in category ' + category.name);
            }
        }

        categoryId = data.categories.find((item) => item.name === '\u9580\u7981').id;
        return '\u5206\u985e: ' + data.categories.map((item) => item.name + '(' + item.productCount + ')').join(', ');
    });

    let singleProductId;
    await test('2. POST /api/products should create a normal product with four prices', async () => {
        const res = await fetch(BASE + '/api/products', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                categoryId,
                brand: 'SOYAL',
                model: 'AR-837-EA-TEST',
                name: '\u9a57\u6536\u6e2c\u8a66-\u9580\u7981\u63a7\u5236\u5668',
                description: '\u9a57\u6536\u7528\u6e2c\u8a66\u7522\u54c1',
                quoteName: '\u9580\u7981\u63a7\u5236\u5668 AR-837-EA',
                quoteDesc: '\u9a57\u6536\u7528\u5b89\u88dd\u914d\u7f6e',
                type: 'single',
                unit: '\u7d44',
                costPrice: 3000,
                marketPrice: 5000,
                sellingPrice: 6500,
                repairPrice: 4000,
                isHiddenItem: false,
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + JSON.stringify(data));

        singleProductId = data.id;
        if (!singleProductId) throw new Error('No product id returned');

        const cp = Number(data.costPrice);
        const mp = Number(data.marketPrice);
        const sp = Number(data.sellingPrice);
        const rp = Number(data.repairPrice);
        if (cp !== 3000) throw new Error('costPrice=' + cp + ', expected 3000');
        if (mp !== 5000) throw new Error('marketPrice=' + mp + ', expected 5000');
        if (sp !== 6500) throw new Error('sellingPrice=' + sp + ', expected 6500');
        if (rp !== 4000) throw new Error('repairPrice=' + rp + ', expected 4000');

        return 'ID: ' + singleProductId + ', \u6210\u672c:' + cp + ' \u5e02\u5834:' + mp + ' \u552e\u50f9:' + sp + ' \u7dad\u4fee:' + rp;
    });

    let bundleProductId;
    await test('3. POST bundle product and add bundle item', async () => {
        const res = await fetch(BASE + '/api/products', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                categoryId,
                name: '\u9a57\u6536\u6e2c\u8a66-\u9580\u7981\u7d44\u5408\u5305',
                type: 'bundle',
                unit: '\u5957',
                costPrice: 15000,
                sellingPrice: 25000,
            }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error('Create bundle failed: ' + JSON.stringify(data));
        bundleProductId = data.id;
        if (!bundleProductId) throw new Error('No bundle id returned');

        const addRes = await fetch(BASE + '/api/products/' + bundleProductId + '/bundle-items', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                productId: singleProductId,
                quantity: 2,
                sortOrder: 0,
            }),
        });
        const addData = await addRes.json();
        if (!addRes.ok) throw new Error('Add bundle item failed: ' + JSON.stringify(addData));

        const getRes = await fetch(BASE + '/api/products/' + bundleProductId + '/bundle-items', {
            headers: headers(),
        });
        const getData = await getRes.json();
        if (!getRes.ok) throw new Error('Get bundle items failed: ' + JSON.stringify(getData));

        const items = getData.bundleItems || getData;
        if (!Array.isArray(items) || items.length === 0) throw new Error('No bundle items found');

        return 'Bundle ID: ' + bundleProductId + ', 項目數: ' + items.length + ', 第一項數量: ' + items[0]?.quantity;
    });

    await test('4. POST /api/products should reject costPrice = -1', async () => {
        const res = await fetch(BASE + '/api/products', {
            method: 'POST',
            headers: headers(),
            body: JSON.stringify({
                categoryId,
                name: '\u8ca0\u50f9\u683c\u6e2c\u8a66',
                type: 'single',
                costPrice: -1,
                sellingPrice: 100,
            }),
        });

        if (res.ok) {
            const data = await res.json();
            if (data.id) {
                await fetch(BASE + '/api/products/' + data.id, {
                    method: 'DELETE',
                    headers: headers(),
                });
            }
            throw new Error('API accepted costPrice = -1. Validation is missing.');
        }

        const data = await res.json();
        return '\u5df2\u6b63\u78ba\u62d2\u7d55: HTTP ' + res.status + ', ' + (data.error || JSON.stringify(data));
    });

    await test('5. DELETE /api/products/:id should soft delete product', async () => {
        if (!singleProductId) throw new Error('No product available to delete');

        const res = await fetch(BASE + '/api/products/' + singleProductId, {
            method: 'DELETE',
            headers: headers(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + JSON.stringify(data));

        const listRes = await fetch(BASE + '/api/products?search=%E9%A9%97%E6%94%B6%E6%B8%AC%E8%A9%A6', {
            headers: headers(),
        });
        const listData = await listRes.json();
        const found = listData.products?.find((item) => item.id === singleProductId);
        if (found) throw new Error('Deleted product still appears in normal list');

        const deletedRes = await fetch(BASE + '/api/products?search=%E9%A9%97%E6%94%B6%E6%B8%AC%E8%A9%A6&includeDeleted=true', {
            headers: headers(),
        });
        const deletedData = await deletedRes.json();
        const foundDeleted = deletedData.products?.find((item) => item.id === singleProductId);
        if (!foundDeleted) throw new Error('Soft-deleted product not found with includeDeleted=true');

        return '\u8edf\u522a\u9664\u884c\u70ba\u6b63\u5e38\uff0cincludeDeleted=true \u53ef\u67e5\u5230\u8cc7\u6599';
    });

    await test('6. Product operations should produce audit logs', async () => {
        const res = await fetch(BASE + '/api/audit?page=1&pageSize=20', {
            headers: headers(),
        });
        const data = await res.json();
        if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + JSON.stringify(data));

        const productLogs = (data.logs || []).filter((log) => log.tableName === 'products');
        const actions = productLogs.map((log) => log.action);
        if (!actions.includes('create')) throw new Error('No create audit log found for products');

        return '\u7522\u54c1 audit \u7b46\u6578: ' + productLogs.length + ', actions: ' + [...new Set(actions)].join(', ');
    });

    if (bundleProductId) {
        await fetch(BASE + '/api/products/' + bundleProductId, {
            method: 'DELETE',
            headers: headers(),
        });
    }

    console.log('
========================================');
    console.log('  \u7d50\u679c: ' + passed + ' PASSED, ' + failed + ' FAILED');
    console.log('========================================');
    process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
    console.error('
Fatal:', error.message);
    process.exit(1);
});
