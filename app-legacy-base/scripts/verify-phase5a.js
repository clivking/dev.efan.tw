const http = require('http');
const fs = require('fs');

const TOKEN = fs.readFileSync('token.txt', 'utf8').trim();
const BASE_URL = 'http://localhost:3001';

const CUSTOMER_ID = 'fce6cb03-724a-4474-b2f7-cbbec027e19e';
const CONTACT_ID = '1089c3fb-7a80-4153-8716-57afcdbf7a78';
const COMPANY_NAME_ID = '16e18290-8633-40e3-8431-8a90563d3a2c';
const PRODUCT_ID = '00000000-0000-0000-0000-000000000002';

async function request(method, requestPath, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: requestPath,
      method,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          console.log('Original body:', body);
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log('--- Phase 5A Validation ---');

  console.log('\n2. POST /api/quotes');
  const quoteRes = await request('POST', '/api/quotes', {
    customerId: CUSTOMER_ID,
    contactId: CONTACT_ID,
    companyNameId: COMPANY_NAME_ID,
    taxRate: 5,
  });
  console.log('Status:', quoteRes.status);
  console.log('Quote:', JSON.stringify(quoteRes.body, null, 2));
  const quoteId = quoteRes.body?.id;

  if (!quoteId) {
    console.error('Failed to create quote');
    return;
  }

  console.log(`\n3. POST /api/quotes/${quoteId}/items (Product mode)`);
  const productItemRes = await request('POST', `/api/quotes/${quoteId}/items`, {
    productId: PRODUCT_ID,
    quantity: 2,
    priceMode: 'selling',
  });
  console.log('Status:', productItemRes.status);
  console.log('Product Item:', JSON.stringify(productItemRes.body, null, 2));

  console.log(`\n4. POST /api/quotes/${quoteId}/items (Manual mode)`);
  const manualItemRes = await request('POST', `/api/quotes/${quoteId}/items`, {
    name: '人工項目',
    unit: '式',
    quantity: 1,
    unitPrice: 5000,
    costPrice: 2000,
  });
  console.log('Status:', manualItemRes.status);
  console.log('Manual Item:', JSON.stringify(manualItemRes.body, null, 2));

  console.log(`\n5. GET /api/quotes/${quoteId}`);
  const detailRes = await request('GET', `/api/quotes/${quoteId}`);
  console.log('Status:', detailRes.status);

  if (detailRes.body && detailRes.body.quote) {
    console.log('Detail Amounts:', {
      subtotalAmount: detailRes.body.quote.subtotalAmount,
      totalAmount: detailRes.body.quote.totalAmount,
      totalCost: detailRes.body.quote.totalCost,
      totalProfit: detailRes.body.quote.totalProfit,
      taxCost: detailRes.body.quote.taxCost,
      actualProfit: detailRes.body.quote.actualProfit,
    });
  } else {
    console.log('Unable to read detail amounts from response:', detailRes.body);
  }

  console.log(`\n6. PUT /api/quotes/${quoteId}/status (confirmed)`);
  const statusRes = await request('PUT', `/api/quotes/${quoteId}/status`, {
    status: 'confirmed',
  });
  console.log('Status:', statusRes.status);
  console.log('Timestamp Check (confirmedAt):', statusRes.body.confirmedAt);

  console.log(`\n7. PUT /api/quotes/${quoteId} (Direct edit)`);
  const editRes = await request('PUT', `/api/quotes/${quoteId}`, {
    customerNote: 'Should fail',
  });
  console.log('Status (should be 403):', editRes.status);
  console.log('Body:', JSON.stringify(editRes.body));

  console.log(`\n8. POST /api/quotes/${quoteId}/new-version`);
  const versionRes = await request('POST', `/api/quotes/${quoteId}/new-version`);
  console.log('Status:', versionRes.status);
  console.log('New Version Quote Number:', versionRes.body.quoteNumber);
  console.log('Parent Quote ID:', versionRes.body.parentQuoteId);

  const originalDetailRes = await request('GET', `/api/quotes/${quoteId}`);
  console.log('Original isSuperseded:', originalDetailRes.body.quote ? originalDetailRes.body.quote.isSuperseded : 'Cannot get isSuperseded');

  console.log('\n9. DELETE (signed)');
  await request('PUT', `/api/quotes/${quoteId}/status`, { status: 'signed' });
  const deleteRes = await request('DELETE', `/api/quotes/${quoteId}`);
  console.log('Status (should be 403):', deleteRes.status);
  console.log('Body:', JSON.stringify(deleteRes.body));

  console.log('\n10. GET /api/audit');
  const auditRes = await request('GET', '/api/audit?pageSize=5');
  console.log('Status:', auditRes.status);
  console.log('Last Log Action:', auditRes.body?.logs?.[0]?.action);
  console.log('Last Log Table:', auditRes.body?.logs?.[0]?.tableName);
}

main().catch(console.error);
