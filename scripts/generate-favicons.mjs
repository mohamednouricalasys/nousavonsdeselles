import sharp from 'sharp';
import { writeFile, mkdir, copyFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PUBLIC_DIR = join(ROOT, 'public');
const WP_DIR = join(ROOT, 'wordpress-favicons');
const SOURCE = join(ROOT, 'src', 'logo-source.png');
const LOGO_DIR = join(PUBLIC_DIR, 'images', 'logo');

// Bounding boxes measured on src/logo-source.png (1805×805, transparent)
const FULL_BOX = { left: 45, top: 101, right: 1710, bottom: 664 };
const EMBLEM_BOX = { left: 45, top: 101, right: 624, bottom: 664 };

const CREAM = { r: 251, g: 244, b: 235, alpha: 1 };
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };

const SIZES = {
  'favicon-16x16.png': 16,
  'favicon-32x32.png': 32,
  'favicon-48x48.png': 48,
  'apple-touch-icon.png': 180,
  'android-chrome-192x192.png': 192,
  'android-chrome-512x512.png': 512,
  'icon-192.png': 192,
  'icon-512.png': 512,
};
const ICO_SIZES = [16, 32, 48, 64, 128, 256];
// Opaque icons (iOS/Android home screens) get a cream background
const OPAQUE = new Set(['apple-touch-icon.png', 'android-chrome-192x192.png', 'android-chrome-512x512.png', 'icon-192.png', 'icon-512.png']);

const extract = (box) => ({ left: box.left, top: box.top, width: box.right - box.left, height: box.bottom - box.top });

// Square, padded emblem master (1024×1024, transparent)
async function emblemMaster() {
  const inner = 960;
  const emblem = await sharp(SOURCE).extract(extract(EMBLEM_BOX))
    .resize(inner, inner, { fit: 'contain', background: TRANSPARENT }).png().toBuffer();
  return sharp({ create: { width: 1024, height: 1024, channels: 4, background: TRANSPARENT } })
    .composite([{ input: emblem, gravity: 'center' }]).png().toBuffer();
}

function render(master, size, opaque) {
  let img = sharp(master).resize(size, size, { kernel: 'lanczos3' });
  if (opaque) img = img.flatten({ background: CREAM });
  return img;
}

// ICO container with embedded PNG images (supported by all modern browsers / Windows Vista+)
function buildIco(pngs) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  const entries = [];
  let offset = 6 + 16 * pngs.length;
  for (const { size, data } of pngs) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2);
    e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...pngs.map((p) => p.data)]);
}

async function main() {
  await mkdir(LOGO_DIR, { recursive: true });
  const master = await emblemMaster();
  const outDirs = [PUBLIC_DIR, WP_DIR];

  // Site logos
  const full = sharp(SOURCE).extract(extract(FULL_BOX));
  await full.clone().resize({ height: 240 }).png({ compressionLevel: 9 }).toFile(join(LOGO_DIR, 'logo.png'));
  await full.clone().resize({ height: 240 }).webp({ quality: 92 }).toFile(join(LOGO_DIR, 'logo.webp'));
  await sharp(master).resize(256, 256).png({ compressionLevel: 9 }).toFile(join(LOGO_DIR, 'emblem.png'));
  await sharp(master).resize(256, 256).webp({ quality: 92 }).toFile(join(LOGO_DIR, 'emblem.webp'));
  console.log('✓ public/images/logo/{logo,emblem}.{png,webp}');

  for (const [file, size] of Object.entries(SIZES)) {
    const buf = await render(master, size, OPAQUE.has(file)).png({ compressionLevel: 9 }).toBuffer();
    for (const d of outDirs) await writeFile(join(d, file), buf);
    console.log(`✓ ${file} (${size}×${size})`);
  }

  for (const size of [192, 512]) {
    const buf = await render(master, size, true).webp({ quality: 90 }).toBuffer();
    for (const d of outDirs) await writeFile(join(d, `icon-${size}.webp`), buf);
    console.log(`✓ icon-${size}.webp`);
  }

  const pngs = [];
  for (const size of ICO_SIZES) {
    pngs.push({ size, data: await render(master, size, false).png({ compressionLevel: 9 }).toBuffer() });
  }
  const ico = buildIco(pngs);
  for (const d of outDirs) await writeFile(join(d, 'favicon.ico'), ico);
  console.log(`✓ favicon.ico (${ICO_SIZES.join(', ')})`);

  // SVG favicon wrapping the raster emblem so browsers preferring SVG still show the real logo
  const b64 = (await sharp(master).resize(128, 128).png({ compressionLevel: 9 }).toBuffer()).toString('base64');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 128 128"><image width="128" height="128" href="data:image/png;base64,${b64}" xlink:href="data:image/png;base64,${b64}"/></svg>\n`;
  for (const d of outDirs) await writeFile(join(d, 'favicon.svg'), svg);
  console.log('✓ favicon.svg');

  await copyFile(join(LOGO_DIR, 'logo.png'), join(WP_DIR, 'logo.png'));
  console.log('\n✅ Done');
}

main().catch((e) => { console.error(e); process.exit(1); });
