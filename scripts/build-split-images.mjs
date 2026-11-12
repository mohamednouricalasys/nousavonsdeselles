/**
 * Slide images: the photos behind the hero carousel and the photo gallery.
 *
 *   hero      the hero carousel     5 slides, 1200 / 800 px wide
 *   galerie   the photo gallery     5 photos, 1000 / 600 px wide
 *
 * Every slide is 4:5. Most are one photo cropped around a focus point. The Les
 * Précieuses slide is a split: two photos on a clean grid, parted by a thin
 * paper-coloured gutter, with no shadow, sticker, shape or other decoration.
 * Only photos with a social meaning: people and shared moments. Sources are the
 * optimized WebP photos already in public/images. Les Précieuses photos are taken only
 * from its own page, https://nousavonsdeselles.fr/les-precieuses/ (images/lesprecieuses/:
 * collecte-dons = collecte.webp, tri-des-dons = selection.webp, collaboratrice-seconde-main
 * = hero.webp, the project card).
 *
 *   npm run split-images              # every set
 *   npm run split-images -- galerie   # one set (or several, comma separated)
 *
 * Output: public/images/splits/<set>-NN-<width>.webp
 */
import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public', 'images');
const OUT = join(SRC, 'splits');

const RATIO = 5 / 4; /* height / width of every slide */
const PAPER = '#faf4eb'; /* --color-paper, oklch(97% 0.014 78) */

/* The box to keep, in source pixels, for a frame of the given height / width ratio: as
   large as the photo allows (divided by zoom), centred on the focus point (0–1) and
   pushed back inside the photo when it overflows. */
function cropBox(width, height, { x = 0.5, y = 0.5, zoom = 1 } = {}, ratio = RATIO) {
  const w = Math.floor(Math.min(width, height / ratio) / zoom);
  const h = Math.min(height, Math.round(w * ratio));
  const clamp = (v, max) => Math.round(Math.min(max, Math.max(0, v)));
  return { left: clamp(x * width - w / 2, width - w), top: clamp(y * height - h / 2, height - h), width: w, height: h };
}

/* A photo: 'dir/file.webp' or ['dir/file.webp', { x, y, zoom, region }], cropped to the
   ratio. `region` ({ left, top, width, height }, source pixels) narrows the photo first,
   to frame a detail such as a note on a basket. */
async function photo(src, ratio = RATIO) {
  const [file, focus = {}] = Array.isArray(src) ? src : [src];
  let input = await sharp(join(SRC, file)).rotate().toBuffer();
  if (focus.region) input = await sharp(input).extract(focus.region).toBuffer();
  const { width, height } = await sharp(input).metadata();
  return sharp(input).extract(cropBox(width, height, focus, ratio)).png().toBuffer();
}

/* ------------------------------------------------------------------ splits
   Drawn at 1200 × 1500, then scaled to each size. G is the gutter. */
const W = 1200;
const H = W * RATIO;
const G = 16;

const LAYOUTS = {
  /* a wide band over a large photo; the band sits on top, clear of the slide's tag and buttons */
  feature: [
    { x: 0, y: 0, w: W, h: H - 880 - G },
    { x: 0, y: H - 880, w: W, h: 880 },
  ],
};

async function split(layout, photos) {
  const cells = LAYOUTS[layout];
  const layers = await Promise.all(cells.map(async (c, i) => ({
    input: await sharp(await photo(photos[i], c.h / c.w)).resize(c.w, c.h).png().toBuffer(),
    left: c.x,
    top: c.y,
  })));
  return sharp({ create: { width: W, height: H, channels: 3, background: PAPER } }).composite(layers).png().toBuffer();
}

/* A slide: a photo (see photo()) or { split: layout, photos: [...] } */
const slide = (s) => (s.split ? split(s.split, s.photos) : photo(s));

/* ------------------------------------------------------------------ the sets */
const SETS = {
  /* The hero carousel: Station-Cœur photos, with one Les Précieuses split.
     No clothes close-ups, no goods on display: the crops keep racks and stock out of frame,
     and Les Précieuses is shown through the people around it. */
  hero: {
    sizes: [1200, 800],
    slides: [
      ['station-coeur/gallery-49.webp', { x: 0, y: 0.45, zoom: 1.25 }], /* the team, arms open (the rail on the right is cut out) */
      { /* Les Précieuses, the solidarity behind it: donated clothes packed for collection, over
           a volunteer sorting the donations */
        split: 'feature',
        photos: [
          ['lesprecieuses/collecte-dons.webp', { y: 0.4 }],
          ['lesprecieuses/tri-des-dons.webp', { y: 0.38 }],
        ],
      },
      ['galerie/boutique-07-1600.webp', { y: 0.6 }], /* hats on the terrace, in front of the station */
      ['station-coeur/gallery-40.webp', { x: 1, y: 0.5, zoom: 1.15 }], /* a shared moment on the steps (the hanging bag is cut out) */
      ['galerie/boutique-12-1600.webp', { x: 0.38 }], /* two smiles in front of the shop */
    ],
  },

  /* The photo gallery */
  galerie: {
    sizes: [1000, 600],
    slides: [
      ['station-coeur/activity-24-jeux.webp', { x: 0.45 }], /* a game across generations */
      ['station-coeur/gallery-21.webp', { y: 0.55 }], /* two residents on the station forecourt */
      ['galerie/boutique-11-1600.webp', { y: 0.55 }], /* a meeting with a dog */
      ['station-coeur/gallery-27.webp', { y: 0.4 }], /* a resident in front of the station */
      ['station-coeur/gallery-31.webp', { y: 0.4 }], /* a smiling resident */
    ],
  },
};

async function main() {
  const only = (process.argv[2] || '').split(',').filter(Boolean);
  await mkdir(OUT, { recursive: true });
  for (const [set, { sizes, slides }] of Object.entries(SETS)) {
    if (only.length && !only.includes(set)) continue;
    for (let i = 0; i < slides.length; i++) {
      const name = `${set}-${String(i + 1).padStart(2, '0')}`;
      const png = await slide(slides[i]);
      for (const size of sizes) {
        const info = await sharp(png)
          .resize(size, Math.round(size * RATIO))
          .webp({ quality: size > 900 ? 80 : 78, effort: 6, smartSubsample: true })
          .toFile(join(OUT, `${name}-${size}.webp`));
        console.log(`✓ ${name}-${size}.webp  ${info.width}×${info.height}  ${Math.round(info.size / 1024)} KB`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
