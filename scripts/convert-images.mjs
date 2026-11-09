import sharp from 'sharp';
import { readdir, mkdir, copyFile } from 'fs/promises';
import { join, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = join(__dirname, '..');
const IMG_SOURCE = join(ROOT, '..', 'img');
const OUTPUT_DIR = join(ROOT, 'public', 'images');

// Selected images for Les Précieuses (curated, no duplicates)
const LESPRECIEUSES_IMAGES = [
  'WhatsApp Image 2026-11-09 at 11.07.51.jpeg',           // Pink silk clothing
  'WhatsApp Image 2026-11-09 at 11.07.54.jpeg',           // Jewelry box full view
  'WhatsApp Image 2026-11-09 at 11.08.01.jpeg',           // Shop interior blue wall
  'WhatsApp Image 2026-11-09 at 11.08.02 (1).jpeg',       // Colorful clothing rack
  'WhatsApp Image 2026-11-09 at 11.07.56 (2).jpeg',       // Black Monoprix shirt
  'WhatsApp Image 2026-11-09 at 11.08.04.jpeg',           // Decorative items vintage
  'WhatsApp Image 2026-11-09 at 11.08.03 (7).jpeg',       // Wooden gift box
  'WhatsApp Image 2026-11-09 at 11.08.03 (8).jpeg',       // Ceramic vase with painting
  'WhatsApp Image 2026-11-09 at 11.08.02 (6).jpeg',       // Shelves with decor
  'WhatsApp Image 2026-11-09 at 11.07.55 (2).jpeg',       // Jewelry drawer
  'WhatsApp Image 2026-11-09 at 11.07.54 (3).jpeg',       // Jewelry top view
  'WhatsApp Image 2026-11-09 at 11.08.02 (7).jpeg',       // Orange lamps
];

// Output filenames (SEO-friendly)
const LESPRECIEUSES_OUTPUT_NAMES = [
  'vetements-soie-rose',
  'bijoux-boucles-oreilles',
  'boutique-interieur',
  'portant-vetements-colores',
  'chemise-noire-detail',
  'objets-decoratifs-vintage',
  'coffret-cadeau-bois',
  'vase-ceramique-tableau',
  'etageres-decoration',
  'tiroir-bijoux',
  'bijoux-vue-dessus',
  'lampes-orange-retro',
];

// Sizes for responsive images
const SIZES = {
  hero: { width: 1920, height: 1080 },
  large: { width: 1200, height: 800 },
  medium: { width: 800, height: 600 },
  thumb: { width: 400, height: 300 },
};

async function convertImage(inputPath, outputPath, options = {}) {
  const { width, height, quality = 85 } = options;

  try {
    let pipeline = sharp(inputPath);

    if (width && height) {
      pipeline = pipeline.resize(width, height, {
        fit: 'cover',
        position: 'center'
      });
    } else if (width) {
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

async function processLesPrecieuses() {
  const sourceDir = join(IMG_SOURCE, 'lesprecieuses');
  const outputDir = join(OUTPUT_DIR, 'lesprecieuses');

  await mkdir(outputDir, { recursive: true });

  console.log('\n📸 Processing Les Précieuses images...\n');

  for (let i = 0; i < LESPRECIEUSES_IMAGES.length; i++) {
    const inputFile = LESPRECIEUSES_IMAGES[i];
    const outputName = LESPRECIEUSES_OUTPUT_NAMES[i];
    const inputPath = join(sourceDir, inputFile);

    // Generate multiple sizes
    await convertImage(inputPath, join(outputDir, `${outputName}-large.webp`), { width: 1200, quality: 85 });
    await convertImage(inputPath, join(outputDir, `${outputName}-medium.webp`), { width: 800, quality: 82 });
    await convertImage(inputPath, join(outputDir, `${outputName}-thumb.webp`), { width: 400, quality: 80 });
  }
}

async function copyStationCoeurImages() {
  const sourceDir = join(IMG_SOURCE, 'station-coeur');
  const outputDir = join(OUTPUT_DIR, 'station-coeur');

  await mkdir(outputDir, { recursive: true });

  console.log('\n📸 Copying Station-Cœur images (already WebP)...\n');

  const files = await readdir(sourceDir);
  for (const file of files) {
    if (file.endsWith('.webp')) {
      await copyFile(join(sourceDir, file), join(outputDir, file));
      console.log(`✓ Copied: ${file}`);
    }
  }
}

async function main() {
  console.log('🖼️  Image Conversion Script for Nous Avons Des Elles\n');
  console.log('=' .repeat(50));

  await processLesPrecieuses();
  await copyStationCoeurImages();

  console.log('\n' + '=' .repeat(50));
  console.log('✅ Image conversion complete!\n');
}

main().catch(console.error);
