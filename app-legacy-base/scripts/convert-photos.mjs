/**
 * Convert HEIC/JPG photos to WebP with SEO-friendly filenames and responsive sizes
 * Usage: node scripts/convert-photos.mjs
 */
import { existsSync } from 'fs';
import { mkdir, readFile } from 'fs/promises';
import convert from 'heic-convert';
import sharp from 'sharp';

const OUTPUT_DIR = 'public/images/portfolio';

const PHOTOS = [
  { src: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\\u5de5\u7a0b\u7cbe\u9078\\IMG_1302.HEIC', name: 'milwaukee-tools-construction', alt: '\u4f7f\u7528 Milwaukee \u5de5\u5177\u65bd\u4f5c\u7684\u5de5\u7a0b\u73fe\u5834' },
  { src: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\\u5de5\u7a0b\u7cbe\u9078\\IMG_1318.HEIC', name: 'anodized-lock-precision-cut', alt: '\u967d\u6975\u9396\u6728\u6846\u958b\u5b54\u65bd\u5de5\u7d30\u7bc0' },
  { src: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\\u5de5\u7a0b\u7cbe\u9078\\IMG_1327.HEIC', name: 'flush-mount-card-reader', alt: '\u5d4c\u5165\u5f0f\u8b80\u5361\u6a5f\u5b89\u88dd\u5b8c\u6210\u7167' },
  { src: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\\u5de5\u7a0b\u7cbe\u9078\\IMG_1336.HEIC', name: 'infrared-sensor-door-opener', alt: '\u7d05\u5916\u7dda\u611f\u61c9\u958b\u9580\u6309\u9215\u5b89\u88dd' },
  { src: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\IMG_20220616_151306.jpg', name: 'spirit-level-installation', alt: '\u65bd\u5de5\u6642\u4ee5\u6c34\u5e73\u5c3a\u78ba\u8a8d\u5b89\u88dd\u7cbe\u5ea6' },
  { src: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\IMG_0644.HEIC', name: 'taipei-101-immersive-exhibition', alt: '\u53f0\u5317 101 \u6c89\u6d78\u5f0f\u5c55\u5ef3\u5f31\u96fb\u5de5\u7a0b' },
  { src: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\IMG_1557.HEIC', name: 'feiteng-cloud-network-cabinet', alt: '\u98db\u9a30\u96f2\u7aef\u5f31\u96fb\u7bb1\u8207\u6a5f\u6ac3\u6574\u7dda' },
  { src: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\IMG_4977.HEIC', name: 'weshaire-ai-face-recognition', alt: 'WeShaire AI \u81c9\u90e8\u8fa8\u8b58\u9580\u7981\u7cfb\u7d71' },
  { src: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\IMG_8174.HEIC', name: 'hongxi-design-fingerprint-access', alt: '\u5b8f\u74bd\u8a2d\u8a08\u516c\u53f8\u6307\u7d0b\u8fa8\u8b58\u9580\u7981\u7cfb\u7d71' },
];

const WIDTHS = [640, 960, 1280];

async function convertOne(photo) {
  let buffer;
  const isHeic = photo.src.toLowerCase().endsWith('.heic');

  if (isHeic) {
    const raw = await readFile(photo.src);
    const outputBuffer = await convert({
      buffer: raw,
      format: 'JPEG',
      quality: 0.95,
    });
    buffer = Buffer.from(outputBuffer);
    console.log('  HEIC decoded to JPEG buffer ' + (buffer.length / 1024).toFixed(0) + 'KB');
  } else {
    buffer = await readFile(photo.src);
  }

  const img = sharp(buffer);
  const meta = await img.metadata();
  console.log('  Original: ' + meta.width + 'x' + meta.height);

  await sharp(buffer)
    .resize({ width: 1280, withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toFile(OUTPUT_DIR + '/' + photo.name + '.webp');

  for (const width of WIDTHS) {
    if (meta.width && width < meta.width) {
      await sharp(buffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 75, effort: 6 })
        .toFile(OUTPUT_DIR + '/' + photo.name + '-' + width + 'w.webp');
    }
  }

  console.log('  Created ' + photo.name + '.webp and responsive variants');
}

async function main() {
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  for (const photo of PHOTOS) {
    console.log('\nConverting: ' + photo.alt);
    try {
      await convertOne(photo);
    } catch (error) {
      console.error('  Failed: ' + error.message);
    }
  }

  console.log('\nAll conversions complete!');
}

main();
