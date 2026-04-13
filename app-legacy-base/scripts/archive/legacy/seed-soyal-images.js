const { createPrismaClient } = require('./prisma-client.cjs');
const https = require('https');
const fs = require('fs');
const path = require('path');
const p = createPrismaClient();

function fetch(url, binary) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        return fetch(r.headers.location, binary).then(res, rej);
      }
      if (r.statusCode !== 200) return rej(new Error('HTTP ' + r.statusCode));
      const c = [];
      r.on('data', d => c.push(d));
      r.on('end', () => res(binary ? Buffer.concat(c) : Buffer.concat(c).toString()));
    });
    req.on('error', rej);
    req.on('timeout', () => { req.destroy(); rej(new Error('timeout')); });
  });
}

const idMap = {
  'AR-0090M':27,'AR-0100M':273,'AR-1207B':193,'AR-0180M':86,'AR-0300M':89,'AR-0330M':272,
  'AR-0400WF':92,'AR-0400WS':93,'AR-0600M-WPF':240,'AR-0600M-270':94,'AR-0600M-DB-540':276,
  'AR-1306':282,'AR-1304-S':268,'AR-1304-SL':268,'AR-YS-131NO':128,'AR-YS-130NO':29,
  'AR-1211P':129,'AR-1213P':30,'AR-323-D':202,
  'AR-101-PBI-E':251,'AR-101-PBI-S':135,'AR-PB-6ABR':215,'AR-PB5':133,
  'AR-901V02':257,'AR-901A01':258,'AR-MDL-POE-12V12W':97,
  'AR-TAGCI8W50F':230,'AR-TAGCI':228,'AR-TAGCI3W50-MASTER':179,
  'AR-TAGK7':224,'AR-TAGK3':225,'AR-TAGK33W20F-MF06':226,'AR-TAGK1':227,'AR-TAGJ':91,
  'AR-BE-180/078':118,'AR-BU-078/180':26,'AR-0600M-U':114,'AR-0600M-UA':274,
  'AR-MA-46190':108,'AR-0600MZL-WP':255,'AR-0600MZL':101,'AR-0600MZU':156,
  'AR-0300MZL':28,'AR-0400MZL':106,'AR-0300M-U':113,
  'AR-816RB':264,'AR-829RB':119,'AR-721RB':115,'AR-821RB':110,
  'AR-MDL-BLE5':236,'AR-321DAX1':84,'AR-321L485-5V':83,'AR-321L485-12V':82,
  'AR-321L232-5V':212,'AR-727-CM-IO-0804R':277,'AR-727-CM-PLC-0804R':245,
  'AR-727-CM-IO-UDP Fire Release':187,'AR-321-CM':60,
  'AR-837-E':45,'AR-837-EA':46,'AR-837-EL':48,'AR-837-ER':154,
  'AR-727-E':44,'AR-725-E':1,'AR-721-H':41,'AR-321-H':15,
  'AR-331-E':70,'AR-331-EF3DO':69,'AR-363-E':198,'AR-888-H':172,
  'AR-888-PBI-S':72,'AR-888-UL':157,'AR-888-W':38,
  'AR-0600M-R':96,'AR-0600M-WPS':239,'AR-101-H':3,'AR-101-PBI-L':197,
  'AR-1207A':25,'AR-PB2':31,
};

const dir = '/app/public/uploads/products';
let ok = 0, fail = 0, skip = 0;

async function processProduct(pr) {
  const hasImg = await p.uploadedFile.findFirst({ where: { entityType: 'product_image', entityId: pr.id } });
  if (hasImg) { skip++; return; }

  const pageId = idMap[pr.model];
  if (!pageId) { console.log('NO_ID: ' + pr.model); fail++; return; }

  try {
    const html = await fetch('https://www.soyal.com.tw/product.php?act=view&id=' + pageId);
    const re = /data\/goods\/gallery\/[^"'\s]+\.(png|jpg|jpeg)/i;
    const m = html.match(re);
    if (!m) { console.log('NO_IMG: ' + pr.model); fail++; return; }

    const imgUrl = 'https://www.soyal.com.tw/' + m[0];
    const ext = m[1].toLowerCase();
    const fname = 'SOYAL_' + pr.model.replace(/[\/\\]/g, '_') + '.' + ext;

    const buf = await fetch(imgUrl, true);
    if (buf.length < 1000) { console.log('TOO_SMALL: ' + pr.model); fail++; return; }
    fs.writeFileSync(path.join(dir, fname), buf);

    await p.uploadedFile.create({ data: {
      filename: fname, filepath: '/api/uploads/products/' + encodeURIComponent(fname),
      mimetype: 'image/' + ext, size: buf.length, entityType: 'product_image',
      entityId: pr.id, uploadedBy: '00000000-0000-0000-0000-000000000000', sortOrder: 0
    }});
    console.log('OK: ' + pr.model + ' (' + (buf.length / 1024).toFixed(0) + ' KB)');
    ok++;
  } catch (e) {
    console.log('FAIL: ' + pr.model + ' - ' + e.message);
    fail++;
  }
}

async function main() {
  const products = await p.product.findMany({
    where: { brand: 'SOYAL', isDeleted: false },
    select: { id: true, model: true },
    orderBy: { model: 'asc' }
  });

  console.log('Processing ' + products.length + ' SOYAL products...\n');

  for (let i = 0; i < products.length; i++) {
    await processProduct(products[i]);
    if ((i + 1) % 10 === 0) console.log('--- Progress: ' + (i + 1) + '/' + products.length + ' ---');
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('\n=== DONE ===');
  console.log('OK: ' + ok + ', FAIL: ' + fail + ', SKIP: ' + skip);
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());

