/**
 * Phase 1 verification script
 * Run with: node scripts/verify-phase1.mjs
 */

const BASE = 'http://localhost:3000';
let TOKEN = '';
let USER_ID = '';

async function api(method, path, body = null, useToken = true) {
    const headers = { 'Content-Type': 'application/json' };
    if (useToken && TOKEN) headers.Cookie = 'token=' + TOKEN;

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(BASE + path, options);
    const text = await res.text();
    let data;
    try {
        data = JSON.parse(text);
    } catch {
        data = text;
    }
    return { status: res.status, data, headers: res.headers };
}

function assert(condition, message) {
    if (!condition) {
        console.log('  FAIL: ' + message);
        return false;
    }
    console.log('  PASS: ' + message);
    return true;
}

async function step0Login() {
    console.log('
===== Step 0: Login and get token =====');
    const res = await api('POST', '/api/auth/login', { username: 'cliv', password: '0982' }, false);
    assert(res.status === 200, 'login should return 200 (actual: ' + res.status + ')');

    TOKEN = res.data.token;
    USER_ID = res.data.user?.id;
    assert(Boolean(TOKEN), 'token should exist');
    assert(Boolean(USER_ID), 'user id should exist');
}

async function verifySettingsRead() {
    console.log('
===== Verify 1: Read settings =====');
    const res = await api('GET', '/api/settings');
    assert(res.status === 200, 'GET /api/settings should return 200 (actual: ' + res.status + ')');

    const data = res.data;
    const categories = Object.keys(data);
    assert(categories.length > 0, 'settings should contain categories: ' + categories.join(', '));
    assert(categories.includes('company'), 'settings should include company category');
    assert(categories.includes('quote'), 'settings should include quote category');
    assert(categories.includes('api'), 'settings should include api category');

    const apiSettings = data.api || [];
    const aiKey = apiSettings.find((item) => item.key === 'ai_api_key');
    if (aiKey && aiKey.value !== '') {
        assert(aiKey.value === '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', 'encrypted values should be masked');
    } else {
        assert(aiKey?.value === '', 'empty encrypted values should remain empty');
    }
}

async function verifySettingsUpdateAudit() {
    console.log('
===== Verify 2: Update settings and restore =====');

    const before = await api('GET', '/api/settings/quote_valid_days');
    assert(before.status === 200, 'should read quote_valid_days before update');
    const originalValue = before.data.value;

    const update = await api('PUT', '/api/settings/quote_valid_days', { value: 30 });
    assert(update.status === 200, 'should update quote_valid_days to 30');
    assert(update.data.value === '30', 'updated value should be 30');

    const check = await api('GET', '/api/settings/quote_valid_days');
    assert(check.data.value === '30', 'stored value should now be 30');

    const restore = await api('PUT', '/api/settings/quote_valid_days', { value: originalValue });
    assert(restore.status === 200, 'should restore original quote_valid_days');
    assert(restore.data.value === originalValue, 'restored value should match original');

    console.log('  Note: audit log should be checked separately if needed.');
}

async function verifyCounter() {
    console.log('
===== Verify 3: Daily counters =====');

    const res1 = await api('POST', '/api/test/counter', { type: 'customer' });
    const res2 = await api('POST', '/api/test/counter', { type: 'customer' });
    const res3 = await api('POST', '/api/test/counter', { type: 'customer' });

    if (res1.status === 200) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        assert(res1.data.number?.startsWith(today + '-C'), 'customer counter #1 format: ' + res1.data.number);
        assert(res2.data.number?.startsWith(today + '-C'), 'customer counter #2 format: ' + res2.data.number);
        assert(res3.data.number?.startsWith(today + '-C'), 'customer counter #3 format: ' + res3.data.number);
    } else {
        console.log('  Skip: /api/test/counter not available for customer checks.');
    }

    const q1 = await api('POST', '/api/test/counter', { type: 'quote' });
    const q2 = await api('POST', '/api/test/counter', { type: 'quote' });

    if (q1.status === 200) {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        assert(q1.data.number?.startsWith(today + '-'), 'quote counter #1 format: ' + q1.data.number);
        assert(q2.data.number?.startsWith(today + '-'), 'quote counter #2 format: ' + q2.data.number);
    }
}

async function verifyPasswordSecurity() {
    console.log('
===== Verify 4: Password hashes =====');

    const res = await api('GET', '/api/test/password-check');
    if (res.status === 200) {
        for (const user of res.data.users) {
            const isBcrypt = user.hashPrefix.startsWith('$2b$') || user.hashPrefix.startsWith('$2a$');
            assert(isBcrypt, user.username + ' should use bcrypt hash (prefix: ' + user.hashPrefix + ')');
        }
    } else {
        console.log('  Skip: /api/test/password-check not available.');
    }
}

async function verifyTokenHandling() {
    console.log('
===== Verify 5: Token handling =====');

    const noTokenRes = await api('GET', '/api/auth/me', null, false);
    assert(noTokenRes.status === 401, 'missing token should return 401 (actual: ' + noTokenRes.status + ')');

    const invalidRes = await fetch(BASE + '/api/auth/me', {
        headers: {
            'Content-Type': 'application/json',
            Cookie: 'token=this.is.a.fake.token.value',
        },
    });
    assert(invalidRes.status === 401, 'invalid token should return 401 (actual: ' + invalidRes.status + ')');

    const validRes = await api('GET', '/api/auth/me');
    assert(validRes.status === 200, 'valid token should return 200 (actual: ' + validRes.status + ')');
}

async function main() {
    console.log('Starting Phase 1 verification');
    console.log('===============================');

    await step0Login();
    await verifySettingsRead();
    await verifySettingsUpdateAudit();
    await verifyCounter();
    await verifyPasswordSecurity();
    await verifyTokenHandling();

    console.log('
===============================');
    console.log('Phase 1 verification complete');
}

main().catch(console.error);
