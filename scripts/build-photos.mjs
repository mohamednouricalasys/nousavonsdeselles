/**
 * The photos of the landing page, built from the originals in img/ only: iPhone HEIC,
 * WhatsApp JPEG and one WebP.
 *
 * Every photo is
 *   1. decoded upright (HEIC with heic-decode; sharp cannot read it), its Display P3
 *      colours converted to sRGB, the colour space of the web;
 *   2. cleaned: `region` keeps the photo itself and cuts away what is not part of it,
 *      such as video black bars, a video player's progress bar, a phone screenshot's
 *      black bands and home bar, or the white gutters between collage panels;
 *   3. cropped to the frame of its slot (`ratio`) around a focus point;
 *   4. resized without enlargement and saved as WebP, with no metadata (no EXIF, no GPS).
 *
 * Each photo is used once on the page. Left out of img/ on purpose:
 *   - byte-identical copies: IMG_26334 copie.HEIC (= IMG_2633), WhatsApp … 16.20.17 (6),
 *     (7) and (8) (= (2), (3) and (4));
 *   - a second shot of a moment already shown: WhatsApp … 16.20.17 (= IMG_8287, the
 *     coffee on the terrace), WhatsApp … 16.20.17 (4) (= IMG_9994, the produce stand),
 *     IMG_7799 (= IMG_7802, the orange coat);
 *   - WhatsApp … 16.26.37: a generated picture of a shop corner, not a photo;
 *   - the left panel of WhatsApp … 16.21.59 (1): a child seen from behind, faces cut.
 *
 *   npm run photos                    # every photo
 *   npm run photos -- name1,name2     # only these (output names, without the width)
 *
 * Output: public/images/photos/<name>-<width>.webp
 */
import sharp from 'sharp';
import decodeHeic from 'heic-decode';
import { readFile, mkdir } from 'fs/promises';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'img');
const OUT = join(ROOT, 'public', 'images', 'photos');

const PORTRAIT = 4 / 5; /* width / height: hero carousel and gallery */
const LANDSCAPE = 4 / 3; /* the two project cards */
/* Widths: the hero shows at 32rem on desktop, a card at about 40rem, a gallery photo at
   about 26rem; the large width covers screens of density 2. */
const HERO = [1200, 800];
const CARD = [1200, 800];
const GALLERY = [800, 480];

/* Cleaned parts of the WhatsApp images (upright source pixels) */
const SCREENSHOT = { left: 0, top: 147, width: 736, height: 1306 }; /* 16.26.37 (1)–(3): black bands and home bar cut off */
const COLLAGE_3 = '16.21.59 (1)'; /* three panels parted by white gutters at x 503–514 and 1042–1051 */
const COLLAGE_2 = '16.21.59 (2)'; /* two panels parted by a white gutter at x 885–911, dark top line */
const whatsapp = (time) => `WhatsApp Image 2026-11-12 at ${time}.jpeg`;

/* ------------------------------------------------------------------ the photos
   src     file in img/
   name    SEO file name (French, lowercase, hyphens), the width is appended
   ratio   width / height of the slot
   sizes   widths to build; a width larger than the crop is replaced by the crop width
   region  { left, top, width, height } in upright source pixels: the clean part
   focus   { x, y } 0–1 within the region: the point the crop is centred on */
const PHOTOS = [
  /* Hero carousel, in order */
  { src: 'IMG_2633.HEIC', name: 'station-coeur-groupe-bras-leves-tiny-house', ratio: PORTRAIT, sizes: HERO },
  { src: 'IMG_6028 2.heic', name: 'les-precieuses-jupe-fleurie-seconde-main', ratio: PORTRAIT, sizes: HERO, focus: { x: 1 } },
  { src: 'IMG_0004.heic', name: 'station-coeur-sourires-devant-la-tiny-house', ratio: PORTRAIT, sizes: HERO },
  { src: 'IMG_9845 (1).HEIC', name: 'station-coeur-complicite-quai-des-possibles', ratio: PORTRAIT, sizes: HERO, focus: { y: 0 } }, /* a phone at the bottom edge is cut off */
  { src: 'IMG_9124.heic', name: 'station-coeur-terrasse-tiny-house', ratio: PORTRAIT, sizes: HERO, focus: { y: 1 } },

  /* Project cards */
  { src: whatsapp('16.20.17 (5)'), name: 'station-coeur-sourire-entre-generations', ratio: LANDSCAPE, sizes: CARD,
    region: { left: 0, top: 7, width: 1600, height: 898 }, focus: { x: 0.56 } }, /* video frame: black band at the top cut off */
  { src: 'IMG_7802.heic', name: 'les-precieuses-portant-vetements-seconde-main', ratio: LANDSCAPE, sizes: CARD },

  /* Gallery, in order */
  { src: whatsapp(COLLAGE_2), name: 'jeu-de-societe-entre-generations', ratio: PORTRAIT, sizes: GALLERY,
    region: { left: 0, top: 2, width: 883, height: 901 }, focus: { x: 0 } }, /* left panel */
  { src: whatsapp('16.26.37 (2)'), name: 'essayage-boucles-oreilles-seconde-main', ratio: PORTRAIT, sizes: GALLERY, region: SCREENSHOT, focus: { y: 0.44 } },
  { src: 'IMG_8287.HEIC', name: 'cafe-seniors-terrasse-devant-la-gare', ratio: PORTRAIT, sizes: GALLERY, focus: { x: 0.47 } },
  { src: 'IMG_0330 (1).HEIC', name: 'chemisier-vert-et-chapeau-de-paille', ratio: PORTRAIT, sizes: GALLERY, focus: { y: 0 } },
  { src: whatsapp('16.21.59 (3)'), name: 'cercle-de-discussion', ratio: PORTRAIT, sizes: GALLERY, focus: { x: 0.49 } },
  { src: whatsapp('16.26.37 (1)'), name: 'bijoux-seconde-main', ratio: PORTRAIT, sizes: GALLERY, region: SCREENSHOT, focus: { y: 0.53 } },
  { src: 'IMG_9994.heic', name: 'stand-produits-locaux', ratio: PORTRAIT, sizes: GALLERY, focus: { x: 0.7 } },
  { src: 'IMG_2456.heic', name: 'sourires-boutique-solidaire', ratio: PORTRAIT, sizes: GALLERY, focus: { x: 0.33 } }, /* three of the four faces of a selfie */
  { src: whatsapp('16.26.37 (3)'), name: 'pull-jaune-portant-seconde-main', ratio: PORTRAIT, sizes: GALLERY, region: SCREENSHOT, focus: { y: 0.55 } },
  { src: whatsapp('16.20.17 (2)'), name: 'conversation-sur-les-marches-tiny-house', ratio: PORTRAIT, sizes: GALLERY,
    region: { left: 0, top: 10, width: 1600, height: 900 }, focus: { x: 0.47 } }, /* video frame: black bands at the top and bottom cut off */
  { src: 'IMG_5255.heic', name: 'portrait-lumiere-hiver', ratio: PORTRAIT, sizes: GALLERY, focus: { y: 0 } },
  { src: whatsapp('16.20.17 (3)'), name: 'balade-en-fauteuil-devant-la-tiny-house', ratio: PORTRAIT, sizes: GALLERY, focus: { x: 0.35 } },
  { src: 'IMG_5918 2 (1).HEIC', name: 'veste-et-foulard-seconde-main', ratio: PORTRAIT, sizes: GALLERY },
  { src: whatsapp(COLLAGE_3), name: 'potager-petits-et-grands', ratio: PORTRAIT, sizes: GALLERY,
    region: { left: 1054, top: 0, width: 546, height: 895 }, focus: { y: 0.45 } }, /* right panel */
  { src: whatsapp(COLLAGE_2), name: 'portrait-chapeau-de-paille', ratio: PORTRAIT, sizes: GALLERY,
    region: { left: 914, top: 2, width: 686, height: 901 }, focus: { y: 0.4 } }, /* right panel */
  { src: 'IMG_0318.HEIC', name: 'essayage-polo-seconde-main', ratio: PORTRAIT, sizes: GALLERY, focus: { y: 0 } },
  { src: whatsapp('16.22.00 (1)'), name: 'gare-facade-et-pelouse', ratio: PORTRAIT, sizes: GALLERY,
    region: { left: 0, top: 4, width: 1580, height: 889 }, focus: { x: 0.53 } }, /* video player bar at the top and black band on the right cut off */
  { src: whatsapp(COLLAGE_3), name: 'fillette-et-bijoux', ratio: PORTRAIT, sizes: GALLERY,
    region: { left: 517, top: 0, width: 523, height: 895 }, focus: { y: 0.6 } }, /* middle panel */
  { src: 'IMG_5929.heic', name: 'flacons-en-verre-chines', ratio: PORTRAIT, sizes: GALLERY, focus: { y: 1 } },
  { src: 'gallery-34.webp', name: 'plants-a-la-main-quai-des-possibles', ratio: PORTRAIT, sizes: GALLERY },
  { src: whatsapp('16.21.59'), name: 'essayage-collier-entraide', ratio: PORTRAIT, sizes: GALLERY,
    region: { left: 0, top: 0, width: 1600, height: 899 }, focus: { x: 0.58 } }, /* video frame: dark bottom line cut off */
  { src: whatsapp('16.22.00'), name: 'gare-vue-aerienne-train', ratio: PORTRAIT, sizes: GALLERY,
    region: { left: 0, top: 0, width: 1591, height: 886 }, focus: { x: 0.48 } }, /* black band on the right cut off */
];

/* ------------------------------------------------------------------ colour
   iPhone HEIC photos are Display P3. P3 and sRGB share the D65 white and the sRGB tone
   curve, so the conversion is a 3×3 matrix applied in linear light (the result matches
   LittleCMS to within one level). Out-of-gamut colours are clipped. */
const P3_TO_SRGB = [
  1.2249401, -0.2249404, 0,
  -0.0420569, 1.0420571, 0,
  -0.0196376, -0.0786361, 1.0982735,
];
const TO_LINEAR = Float32Array.from({ length: 256 }, (_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});
const STEPS = 65535;
const TO_SRGB = Uint8Array.from({ length: STEPS + 1 }, (_, i) => {
  const c = i / STEPS;
  return Math.round(255 * (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055));
});

function p3ToSrgb(rgba, width, height) {
  const out = Buffer.alloc(width * height * 3);
  const m = P3_TO_SRGB;
  const enc = (v) => TO_SRGB[(Math.min(1, Math.max(0, v)) * STEPS + 0.5) | 0];
  for (let i = 0, j = 0; j < out.length; i += 4, j += 3) {
    const r = TO_LINEAR[rgba[i]], g = TO_LINEAR[rgba[i + 1]], b = TO_LINEAR[rgba[i + 2]];
    out[j] = enc(m[0] * r + m[1] * g + m[2] * b);
    out[j + 1] = enc(m[3] * r + m[4] * g + m[5] * b);
    out[j + 2] = enc(m[6] * r + m[7] * g + m[8] * b);
  }
  return out;
}

/* The ICC profile of a HEIC sits in its `colr` box; Apple names it in UTF-16. */
const P3_NAME = Buffer.from('Display P3', 'utf16le').swap16();

/* ------------------------------------------------------------------ pipeline */
const cache = new Map();

/* An upright sRGB photo as raw RGB pixels: { data, width, height } */
function load(file) {
  if (!cache.has(file)) {
    cache.set(file, (async () => {
      const buffer = await readFile(join(SRC, file));
      if (extname(file).toLowerCase() === '.heic') {
        const { width, height, data } = await decodeHeic({ buffer });
        const rgba = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
        const rgb = buffer.includes(P3_NAME)
          ? p3ToSrgb(rgba, width, height)
          : await sharp(Buffer.from(rgba), { raw: { width, height, channels: 4 } }).removeAlpha().raw().toBuffer();
        return { data: rgb, width, height };
      }
      /* JPEG and WebP: sharp turns them upright and converts any ICC profile to sRGB */
      const { data, info } = await sharp(buffer).rotate().toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
      return { data, width: info.width, height: info.height };
    })());
  }
  return cache.get(file);
}

/* The box of the given width / height ratio, as large as the region allows, centred on
   the focus point and pushed back inside the region when it overflows. */
function cropBox(region, ratio, { x = 0.5, y = 0.5 } = {}) {
  const width = Math.min(region.width, Math.floor(region.height * ratio));
  const height = Math.min(region.height, Math.round(width / ratio));
  const clamp = (v, max) => Math.round(Math.min(max, Math.max(0, v)));
  return {
    left: region.left + clamp(x * region.width - width / 2, region.width - width),
    top: region.top + clamp(y * region.height - height / 2, region.height - height),
    width,
    height,
  };
}

async function build(photo) {
  const { data, width, height } = await load(photo.src);
  const region = photo.region || { left: 0, top: 0, width, height };
  const box = cropBox(region, photo.ratio, photo.focus);
  const crop = await sharp(data, { raw: { width, height, channels: 3 } }).extract(box).png().toBuffer();
  /* No enlargement: a width larger than the crop gives way to the crop's own width, and a
     width within 15 % of a larger one is dropped */
  const widths = photo.sizes
    .map((w) => Math.min(w, box.width))
    .sort((a, b) => b - a)
    .filter((w, i, all) => i === 0 || w < all[0] * 0.85);
  const files = [];
  for (const w of widths) {
    const h = Math.round(w / photo.ratio);
    const file = `${photo.name}-${w}.webp`;
    const info = await sharp(crop)
      .resize(w, h, { kernel: 'lanczos3' })
      .webp({ quality: w > 1000 ? 76 : 78, effort: 6, smartSubsample: true })
      .toFile(join(OUT, file));
    files.push(`${file} ${info.width}×${info.height} ${Math.round(info.size / 1024)} KB`);
  }
  console.log(`✓ ${photo.name}  (${photo.src}, crop ${box.width}×${box.height})\n    ${files.join('\n    ')}`);
}

async function main() {
  const only = (process.argv[2] || '').split(',').filter(Boolean);
  const names = PHOTOS.map((p) => p.name);
  const twice = names.filter((n, i) => names.indexOf(n) !== i);
  if (twice.length) throw new Error(`Output name used twice: ${twice.join(', ')}`);
  await mkdir(OUT, { recursive: true });
  for (const photo of PHOTOS) {
    if (only.length && !only.includes(photo.name)) continue;
    await build(photo);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
