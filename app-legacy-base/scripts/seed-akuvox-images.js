const { createPrismaClient } = require('./prisma-client.cjs');
const https = require('https');
const fs = require('fs');
const path = require('path');
const p = createPrismaClient();

function fetch(url, binary) {
  return new Promise((res, rej) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        const loc = r.headers.location.startsWith('http') ? r.headers.location : 'https://www.houngfu.com' + r.headers.location;
        return fetch(loc, binary).then(res, rej);
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

// model -> houngfu product page slug
const pageMap = {
  'X910': 'x910',
  'R25A': 'r25a',
  'R25K': 'r25k',
  'R20B': 'r20b',
  'R20A': 'r20a',
  'E13S': 'e13s',
  'S567': 's567',
  'S565': 's565',
  'C313': 'c313',
  'C310': 'c310',
  'SmartPlus': 'akuvox-smartplus-app',
};

const dir = '/app/public/uploads/products';
let ok = 0, fail = 0;

async function processProduct(model) {
  const product = await p.product.findFirst({
    where: { model, brand: 'AKUVOX', isDeleted: false },
    select: { id: true, model: true }
  });
  if (!product) { console.log('NOT FOUND: ' + model); fail++; return; }

  // check if already has image
  const hasImg = await p.uploadedFile.findFirst({ where: { entityType: 'product_image', entityId: product.id } });
  if (hasImg) { console.log('SKIP: ' + model + ' (already has image)'); return; }

  const slug = pageMap[model];
  try {
    const html = await fetch('https://www.houngfu.com/products/' + slug);
    
    // Look for product image in meta og:image or the first product image
    let imgUrl = null;
    
    // Try og:image first
    const ogMatch = html.match(/property="og:image"\s+content="([^"]+)"/i);
    if (ogMatch && ogMatch[1] && !ogMatch[1].includes('logo')) {
      imgUrl = ogMatch[1];
    }
    
    // Try product gallery image
    if (!imgUrl) {
      const galleryMatch = html.match(/class="product-gallery[^"]*"[^>]*>[\s\S]*?<img[^>]+src="([^"]+)"/i);
      if (galleryMatch) imgUrl = galleryMatch[1];
    }
    
    // Try any large product image
    if (!imgUrl) {
      const imgMatch = html.match(/<img[^>]+src="(https?:\/\/[^"]*(?:cdn|shoplineapp|img)[^"]*(?:png|jpg|jpeg|webp)[^"]*)"/i);
      if (imgMatch) imgUrl = imgMatch[1];
    }

    if (!imgUrl) { console.log('NO_IMG: ' + model); fail++; return; }
    
    // Make sure URL is absolute
    if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
    if (!imgUrl.startsWith('http')) imgUrl = 'https://www.houngfu.com' + imgUrl;

    console.log('  URL: ' + imgUrl.substring(0, 80) + '...');
    
    const ext = imgUrl.match(/\.(png|jpg|jpeg|webp)/i) ? imgUrl.match(/\.(png|jpg|jpeg|webp)/i)[1].toLowerCase() : 'jpg';
    const fname = 'AKUVOX_' + model.replace(/[\/\\]/g, '_') + '.' + ext;

    const buf = await fetch(imgUrl, true);
    if (buf.length < 500) { console.log('TOO_SMALL: ' + model + ' (' + buf.length + ' bytes)'); fail++; return; }
    fs.writeFileSync(path.join(dir, fname), buf);

    await p.uploadedFile.create({ data: {
      filename: fname, filepath: '/api/uploads/products/' + encodeURIComponent(fname),
      mimetype: 'image/' + (ext === 'jpg' ? 'jpeg' : ext), size: buf.length, entityType: 'product_image',
      entityId: product.id, uploadedBy: '00000000-0000-0000-0000-000000000000', sortOrder: 0
    }});
    console.log('OK: ' + model + ' (' + (buf.length / 1024).toFixed(0) + ' KB)');
    ok++;
  } catch (e) {
    console.log('FAIL: ' + model + ' - ' + e.message);
    fail++;
  }
}

async function main() {
  const models = Object.keys(pageMap);
  console.log('Processing ' + models.length + ' AKUVOX products...\n');
  for (const model of models) {
    await processProduct(model);
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('\n=== DONE ===');
  console.log('OK: ' + ok + ', FAIL: ' + fail);
}

main().catch(e => console.error(e)).finally(() => p.$disconnect());

