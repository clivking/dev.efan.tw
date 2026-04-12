import { existsSync } from 'fs';
import { mkdir, readFile } from 'fs/promises';
import sharp from 'sharp';

const heicConvert = (await import('heic-convert')).default;

const OUTPUT_DIR = './public/images/portfolio';
const WIDTHS = [640, 960, 1280];

const PHOTOS = [
  {
    input: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\IMG_20220831_145753.jpg',
    name: 'soyal-keypad-access-control',
    caption: 'SOYAL \u611f\u61c9\u8b80\u5361\u9580\u7981\u7cfb\u7d71\u5b8c\u5de5\u7167',
  },
  {
    input: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\IMG_20220311_175417.jpg',
    name: 'glass-door-access-intercom',
    caption: '\u73bb\u7483\u9580\u9580\u7981\u7cfb\u7d71\u642d\u914d\u5c0d\u8b1b\u8a2d\u5099\u5b89\u88dd',
  },
  {
    input: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\IMG_20210922_164105.jpg',
    name: 'soyal-fingerprint-reader-marble',
    caption: 'SOYAL \u6307\u7d0b\u8fa8\u8b58\u9580\u7981\u8a2d\u5099\u5b89\u88dd\u65bc\u5927\u7406\u77f3\u7246\u9762',
  },
  {
    input: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\IMG_3698.HEIC',
    name: 'access-control-completed-01',
    caption: '\u9580\u7981\u7cfb\u7d71\u5b8c\u5de5\u7167 1',
  },
  {
    input: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\IMG_1658.HEIC',
    name: 'access-control-completed-02',
    caption: '\u9580\u7981\u7cfb\u7d71\u5b8c\u5de5\u7167 2',
  },
  {
    input: 'D:\\Desktop\\\u5de5\u7a0b\u7167\u7247\\IMG_1543.HEIC',
    name: 'access-control-completed-03',
    caption: '\u9580\u7981\u7cfb\u7d71\u5b8c\u5de5\u7167 3',
  },
];

if (!existsSync(OUTPUT_DIR)) await mkdir(OUTPUT_DIR, { recursive: true });

for (const photo of PHOTOS) {
  console.log('\nConverting: ' + photo.caption);
  const raw = await readFile(photo.input);
  const isHeic = photo.input.toLowerCase().endsWith('.heic');

  let imgBuffer;
  if (isHeic) {
    const converted = await heicConvert({
      buffer: new Uint8Array(raw),
      format: 'JPEG',
      quality: 0.92,
    });
    imgBuffer = Buffer.from(converted);
    console.log('  HEIC decoded to JPEG buffer ' + Math.round(imgBuffer.length / 1024) + 'KB');
  } else {
    imgBuffer = raw;
    console.log('  JPG buffer ' + Math.round(raw.length / 1024) + 'KB');
  }

  const meta = await sharp(imgBuffer).metadata();
  console.log('  Original: ' + meta.width + 'x' + meta.height);

  await sharp(imgBuffer)
    .webp({ quality: 78, effort: 6 })
    .toFile(OUTPUT_DIR + '/' + photo.name + '.webp');

  for (const width of WIDTHS) {
    if (meta.width && width < meta.width) {
      await sharp(imgBuffer)
        .resize(width)
        .webp({ quality: 75, effort: 6 })
        .toFile(OUTPUT_DIR + '/' + photo.name + '-' + width + 'w.webp');
    }
  }

  console.log('  Created ' + photo.name + '.webp and responsive variants');
}

console.log('\nAll conversions complete!');
