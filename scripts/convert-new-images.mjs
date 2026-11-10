import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { join, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, '..');
const IMG_SOURCE = join(ROOT, 'img');
const OUTPUT_DIR = join(ROOT, 'public', 'images', 'station-coeur');

// New images from the img folder for Station-Cœur
const NEW_IMAGES = [
  { input: 'WhatsApp Image 2026-11-10 at 10.57.13.jpeg', output: 'boutique-new-01' },
  { input: 'WhatsApp Image 2026-11-10 at 10.57.13 (1).jpeg', output: 'boutique-new-02' },
  { input: 'WhatsApp Image 2026-11-10 at 10.57.13 (2).jpeg', output: 'boutique-new-03' },
  { input: 'WhatsApp Image 2026-11-10 at 10.57.13 (3).jpeg', output: 'boutique-new-04' },
  { input: 'WhatsApp Image 2026-11-10 at 10.57.13 (4).jpeg', output: 'boutique-new-05' },
  { input: 'WhatsApp Image 2026-11-10 at 10.57.13 (5).jpeg', output: 'boutique-new-06' },
  { input: 'WhatsApp Image 2026-11-10 at 10.57.13 (6).jpeg', output: 'boutique-new-07' },
  { input: 'WhatsApp Image 2026-11-10 at 10.57.13 (7).jpeg', output: 'boutique-new-08' },
  { input: 'WhatsApp Image 2026-11-10 at 10.57.13 (8).jpeg', output: 'boutique-new-09' },
  { input: 'WhatsApp Image 2026-11-10 at 11.12.48.jpeg', output: 'activity-new-01' },
  { input: 'WhatsApp Image 2026-11-10 at 11.12.48 (1).jpeg', output: 'activity-new-02' },
  { input: 'WhatsApp Image 2026-11-10 at 11.12.48 (2).jpeg', output: 'activity-new-03' },
];

async function convertImage(inputPath, outputPath, options = {}) {
  const { width, quality = 82 } = options;

  try {
    let pipeline = sharp(inputPath);

    if (width) {
      pipeline = pipeline.resize(width, null, { withoutEnlargement: true });
    }

    await pipeline
      .webp({ quality })
      .toFile(outputPath);

    console.log(`✓ Converted: ${basename(outputPath)}`);
  } catch (error) {
    console.error(`✗ Error converting ${basename(inputPath)}: ${error.message}`);
  }
}

async function main() {
  console.log('🖼️  Converting new Station-Cœur images\n');
  console.log('='.repeat(50));

  await mkdir(OUTPUT_DIR, { recursive: true });

  for (const img of NEW_IMAGES) {
    const inputPath = join(IMG_SOURCE, img.input);

    // Generate optimized WebP at 1200px width
    await convertImage(inputPath, join(OUTPUT_DIR, `${img.output}.webp`), { width: 1200, quality: 82 });
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Image conversion complete!\n');
}

main().catch(console.error);
