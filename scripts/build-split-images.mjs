/**
 * Split images: the playful photo collages behind every gallery of the page.
 *
 *   hero      the hero carousel            8 collages, 1200 / 800 px wide
 *   showcase  Les Précieuses en entreprise 4 collages, 1200 / 800 px wide
 *   galerie   the photo gallery slider    11 collages, 1000 / 600 px wide
 *
 * Every collage is 4:5, composed from the optimized WebP photos already in
 * public/images (never from the originals in img/), and decorated with brand
 * shapes only (hearts, sparkles, dots, tape, film holes), never text, so one
 * image serves French and English.
 *
 * Featured photos, the ones kept in img/, star in hero slides 3 and 4: the sign
 * in the station (activity-new-01), the red clothes (boutique-new-01), the gift
 * box and the black shirt (their 1200 × 1600 WebP in lesprecieuses/, the same
 * photos without the screenshot frame). A source marked { frame: true } is a
 * screenshot: its flat-colour frame is cut away before cropping.
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

const W = 1200;
const H = 1500;
const M = 56; /* outer margin */
const G = 36; /* gutter */
const R = 44; /* panel radius */
const CLEAR = { r: 0, g: 0, b: 0, alpha: 0 };

/* ------------------------------------------------------------------ colours
   The site's oklch tokens (styles.css :root), converted to sRGB hex. */
function oklch(L, Ch, h) {
  const a = Ch * Math.cos((h * Math.PI) / 180);
  const b = Ch * Math.sin((h * Math.PI) / 180);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
  return '#' + lin.map((x) => {
    const v = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  }).join('');
}

const C = {
  paper: oklch(0.97, 0.014, 78),
  paperSage: oklch(0.945, 0.024, 145),
  paperSage2: oklch(0.915, 0.032, 145),
  paperCoral: oklch(0.96, 0.025, 10),
  paperCoral2: oklch(0.93, 0.038, 8),
  field: oklch(0.42, 0.08, 157),
  field2: oklch(0.37, 0.072, 159),
  sage: oklch(0.62, 0.09, 150),
  signal: oklch(0.65, 0.12, 12),
  signalSoft: oklch(0.78, 0.08, 15),
  rose: oklch(0.72, 0.1, 8),
  roseDeep: oklch(0.55, 0.14, 5),
  roseLight: oklch(0.92, 0.04, 10),
  seal: oklch(0.74, 0.135, 75),
  sealInk: oklch(0.57, 0.12, 68),
  ink: oklch(0.28, 0.035, 50),
  white: '#ffffff',
};

/* ------------------------------------------------------------------ shapes */
const svg = (w, h, body, defs = '') =>
  Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs ? `<defs>${defs}</defs>` : ''}${body}</svg>`);

/* Shape outline as an SVG element, in the panel's own coordinates (0,0 → w,h). */
function shapePath(shape, w, h) {
  switch (shape.type) {
    case 'circle':
      return `<circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) / 2}"/>`;
    case 'capsule':
      return `<rect width="${w}" height="${h}" rx="${w / 2}" ry="${w / 2}"/>`;
    case 'arch': {
      const r = w / 2;
      const br = shape.r ?? 0;
      return `<path d="M0 ${r} A${r} ${r} 0 0 1 ${w} ${r} V${h - br} Q${w} ${h} ${w - br} ${h} H${br} Q0 ${h} 0 ${h - br} Z"/>`;
    }
    case 'poly':
      return `<polygon points="${shape.points.map((p) => p.join(',')).join(' ')}"/>`;
    case 'rect':
    default:
      return `<rect width="${w}" height="${h}" rx="${shape.r ?? 0}" ry="${shape.r ?? 0}"/>`;
  }
}

const RECT = { type: 'rect', r: R };
const ARCH = { type: 'arch', r: R };

/* A photo source: 'dir/file.webp' or ['dir/file.webp', { x, y, zoom, frame }]
   (focus point in 0–1; frame: the file is a screenshot, keep only the photo inside its frame). */
const S = (src) => (Array.isArray(src) ? { file: src[0], focus: src[1] } : { file: src, focus: {} });

/* Some photos arrive as screenshots: the picture sits on a flat-colour frame with rounded
   corners. The frame colour is the top-left pixel; the photo is the longest run of rows,
   then of columns, that are not almost entirely that colour. The inset clears the corners. */
async function unframe(path, inset = 12) {
  const { data, info } = await sharp(path).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h, channels: c } = info;
  const flat = (x, y) => {
    const i = (y * w + x) * c;
    return Math.abs(data[i] - data[0]) + Math.abs(data[i + 1] - data[1]) + Math.abs(data[i + 2] - data[2]) <= 14;
  };
  const longestRun = (n, isPhoto) => {
    let best = [0, -1];
    let start = -1;
    for (let i = 0; i <= n; i++) {
      if (i < n && isPhoto(i)) { if (start < 0) start = i; continue; }
      if (start >= 0 && i - start > best[1] - best[0] + 1) best = [start, i - 1];
      start = -1;
    }
    return best;
  };
  const [top, bottom] = longestRun(h, (y) => { let k = 0; for (let x = 0; x < w; x++) k += flat(x, y); return k < w * 0.97; });
  const rows = bottom - top + 1;
  const [left, right] = longestRun(w, (x) => { let k = 0; for (let y = top; y <= bottom; y++) k += flat(x, y); return k < rows * 0.97; });
  const box = { left: left + inset, top: top + inset, width: right - left + 1 - 2 * inset, height: rows - 2 * inset };
  return sharp(path).extract(box).png().toBuffer();
}

/* A photo, cropped to cover w×h around its focus point, cut to a shape. */
async function shapedPhoto(file, w, h, shape = RECT, focus = {}) {
  const img = sharp(focus.frame ? await unframe(join(SRC, file)) : join(SRC, file)).rotate();
  const meta = await img.metadata();
  const zoom = focus.zoom ?? 1;
  const scale = Math.max(w / meta.width, h / meta.height) * zoom;
  const rw = Math.ceil(meta.width * scale);
  const rh = Math.ceil(meta.height * scale);
  const fx = focus.x ?? 0.5;
  const fy = focus.y ?? 0.5;
  const left = Math.round(Math.min(rw - w, Math.max(0, fx * rw - w / 2)));
  const top = Math.round(Math.min(rh - h, Math.max(0, fy * rh - h / 2)));
  const photo = await img.resize(rw, rh).extract({ left, top, width: w, height: h }).ensureAlpha().png().toBuffer();
  const mask = svg(w, h, `<g fill="#fff">${shapePath(shape, w, h)}</g>`);
  return sharp(photo).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

/* A soft drop shadow for a shape placed at (x, y), as a full-canvas layer. */
async function shadow(x, y, w, h, shape, { dy = 22, blur = 22, opacity = 0.32, rotate = 0 } = {}) {
  const cx = x + w / 2;
  const cy = y + h / 2 + dy;
  const body = `<g transform="rotate(${rotate} ${cx} ${cy}) translate(${x} ${y + dy})" fill="${C.ink}" fill-opacity="${opacity}">${shapePath(shape, w, h)}</g>`;
  return { input: await sharp(svg(W, H, body)).blur(blur).png().toBuffer(), left: 0, top: 0 };
}

/* An image rotated about its centre, placed so that centre lands on (cx, cy). */
async function turned(buffer, angle, cx, cy) {
  const out = await sharp(buffer).rotate(angle, { background: CLEAR }).png().toBuffer();
  const meta = await sharp(out).metadata();
  return { input: out, left: Math.round(cx - meta.width / 2), top: Math.round(cy - meta.height / 2) };
}

/* ------------------------------------------------------------------ decor */
const heart = (cx, cy, size, fill, rot = 0, extra = '') => {
  const k = size / 24;
  return `<path transform="translate(${cx} ${cy}) rotate(${rot}) scale(${k}) translate(-12 -12.5)" fill="${fill}" ${extra} d="M12 21.5s-7.6-4.7-9.7-9.4C.7 8.6 2.9 4.5 6.7 4.5c2.2 0 3.7 1.1 5.3 3.1 1.6-2 3.1-3.1 5.3-3.1 3.8 0 6 4.1 4.4 7.6-2.1 4.7-9.7 9.4-9.7 9.4z"/>`;
};

const sparkle = (cx, cy, size, fill, rot = 0) => {
  const k = size / 24;
  return `<path transform="translate(${cx} ${cy}) rotate(${rot}) scale(${k}) translate(-12 -12)" fill="${fill}" d="M12 0C12.9 7 17 11.1 24 12 17 12.9 12.9 17 12 24 11.1 17 7 12.9 0 12 7 11.1 11.1 7 12 0z"/>`;
};

const squiggle = (x, y, len, amp, waves, stroke, width, rot = 0) => {
  const step = len / (waves * 2);
  let d = 'M0 0';
  for (let i = 0; i < waves * 2; i++) d += ` q${step / 2} ${i % 2 ? amp : -amp} ${step} 0`;
  return `<path transform="translate(${x} ${y}) rotate(${rot})" d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="round"/>`;
};

const dashedRing = (cx, cy, r, stroke, width = 4) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${stroke}" stroke-width="${width}" stroke-dasharray="2 16" stroke-linecap="round"/>`;

/* A round paper sticker with a motif in the middle. */
const sticker = (cx, cy, r, ring, inner) =>
  `<circle cx="${cx}" cy="${cy + 10}" r="${r}" fill="${C.ink}" fill-opacity=".18"/>` +
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.paper}"/>` +
  `<circle cx="${cx}" cy="${cy}" r="${r - 14}" fill="none" stroke="${ring}" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>` +
  inner;

/* A strip of washi tape. */
const tape = (cx, cy, w, h, rot, fill, opacity = 0.82) =>
  `<g transform="translate(${cx} ${cy}) rotate(${rot})" opacity="${opacity}">` +
  `<path d="M${-w / 2} ${-h / 2} H${w / 2} l-8 ${h / 4} 8 ${h / 4} -8 ${h / 4} 8 ${h / 4} H${-w / 2} l8 ${-h / 4} -8 ${-h / 4} 8 ${-h / 4} z" fill="${fill}"/>` +
  `<path d="M${-w / 2 + 10} ${-h / 2 + 10} H${w / 2 - 10}" stroke="#fff" stroke-opacity=".35" stroke-width="6"/>` +
  `</g>`;

/* Sticker motifs */
const motifs = {
  heart: (color) => (x, y) => heart(x, y + 2, 70, color, -8),
  sparkle: (color) => (x, y) => sparkle(x, y, 66, color, 0),
};

/* ------------------------------------------------------------------ composer
   Layers, bottom to top: background colour → dot pattern and `under` shapes →
   each panel (shadow, optional paper ring, photo) → `over` decorations. */
const panel = (src, x, y, w, h, extra = {}) => ({ ...S(src), x, y, w, h, ...extra });

async function compose({ background, pattern, under = '', defs = '', panels = [], over = '' }) {
  if (pattern) {
    defs += `<pattern id="pat" width="${pattern.gap}" height="${pattern.gap}" patternUnits="userSpaceOnUse"><circle cx="${pattern.gap / 2}" cy="${pattern.gap / 2}" r="${pattern.r}" fill="${pattern.color}" fill-opacity="${pattern.opacity ?? 0.4}"/></pattern>`;
    under = `<rect width="${W}" height="${H}" fill="url(#pat)"/>` + under;
  }
  const layers = [];
  if (under) layers.push({ input: svg(W, H, under, defs), left: 0, top: 0 });

  for (const p of panels) {
    if (p.layers) { layers.push(...p.layers); continue; }
    if (p.polaroid) { layers.push(...(await polaroid(p))); continue; }
    const shape = p.shape ?? RECT;
    if (p.shadow !== false) layers.push(await shadow(p.x, p.y, p.w, p.h, shape, p.shadow || {}));
    if (p.ring) {
      const g = p.ring.width;
      layers.push({
        input: svg(W, H, `<g transform="translate(${p.x - g} ${p.y - g})" fill="${p.ring.color}">${shapePath(shape, p.w + 2 * g, p.h + 2 * g)}</g>`),
        left: 0, top: 0,
      });
    }
    layers.push({ input: await shapedPhoto(p.file, p.w, p.h, shape, p.focus), left: p.x, top: p.y });
  }

  if (over) layers.push({ input: svg(W, H, over, defs), left: 0, top: 0 });

  return sharp({ create: { width: W, height: H, channels: 4, background } }).composite(layers).png().toBuffer();
}

/* A white instant-photo card, tilted, with its shadow. Returns composite layers. */
async function polaroid({ file, focus, x, y, w, h, rotate = 0, border = 26, bottom = 96 }) {
  const photo = await shapedPhoto(file, w - 2 * border, h - border - bottom, { type: 'rect', r: 6 }, focus);
  const card = await sharp(svg(w, h, `<rect width="${w}" height="${h}" rx="10" fill="${C.white}"/>`))
    .composite([{ input: photo, left: border, top: border }])
    .png()
    .toBuffer();
  return [
    await shadow(x, y, w, h, { type: 'rect', r: 10 }, { rotate, dy: 26, blur: 20, opacity: 0.38 }),
    await turned(card, rotate, x + w / 2, y + h / 2),
  ];
}

/* ------------------------------------------------------------------ layouts */
const layouts = {
  /* One tall photo beside two stacked ones, a sticker where they meet. */
  bigStack({ bg, pattern, under = '', tall, top, bottom, mirror = false, tallShape = RECT, tallW = 600, ring = C.sage, motif, decor = () => '' }) {
    const sideW = W - 2 * M - G - tallW;
    const tallX = mirror ? M + sideW + G : M;
    const sideX = mirror ? M : M + tallW + G;
    const ch = (H - 2 * M - G) / 2;
    const g = { tallX, tallW, sideX, sideW, ch, jx: mirror ? sideX + sideW + G / 2 : tallX + tallW + G / 2, jy: M + ch + G / 2 };
    return compose({
      background: bg, pattern, under,
      panels: [
        panel(tall, tallX, M, tallW, H - 2 * M, { shape: tallShape }),
        panel(top, sideX, M, sideW, ch),
        panel(bottom, sideX, M + ch + G, sideW, ch),
      ],
      over: sticker(g.jx, g.jy, 74, ring, motif(g.jx, g.jy)) + decor(g),
    });
  },

  /* Two tall panels, the second one dropped a little. */
  diptych({ bg, pattern, under = '', left, right, stagger = 110, decor = () => '' }) {
    const pw = (W - 2 * M - G) / 2;
    const ph = H - 2 * M - stagger;
    const g = { pw, ph, rx: M + pw + G };
    return compose({
      background: bg, pattern, under,
      panels: [panel(left, M, M, pw, ph), panel(right, g.rx, M + stagger, pw, ph)],
      over: decor(g),
    });
  },

  /* An arched window, a round portrait in a paper ring, a sun and a dashed halo.
     The round inset sits low on the right, clear of the carousel controls; `inset` moves it
     when it would hide the arch's subject. */
  archCircle({ bg, arch, circle, inset = {}, sun = C.seal, halo = C.seal, wave = C.sage, heartColor = C.signal, sparkA = C.seal, sparkB = C.paper }) {
    const ax = 120;
    const aw = W - 2 * ax;
    const ay = 92;
    const ah = 1230;
    const { cx = W - 250, cy = ay + ah - 310, r: cr = 205 } = inset;
    return compose({
      background: bg,
      under:
        `<circle cx="150" cy="190" r="96" fill="${sun}"/>` +
        `<path d="M${ax - 30} ${ay + aw / 2} A${aw / 2 + 30} ${aw / 2 + 30} 0 0 1 ${ax + aw + 30} ${ay + aw / 2}" fill="none" stroke="${halo}" stroke-width="5" stroke-dasharray="3 18" stroke-linecap="round"/>` +
        squiggle(90, H - 110, 380, 16, 5, wave, 10, -4),
      panels: [
        panel(arch, ax, ay, aw, ah, { shape: ARCH, shadow: { opacity: 0.45 } }),
        panel(circle, cx - cr, cy - cr, 2 * cr, 2 * cr, { shape: { type: 'circle' }, ring: { width: 16, color: C.paper }, shadow: { opacity: 0.45 } }),
      ],
      over:
        sparkle(cx - cr - 30, cy - cr + 10, 52, sparkA, 0) +
        sparkle(cx - cr + 6, cy - cr - 34, 24, sparkB, 0) +
        heart(cx + cr - 10, cy + cr - 30, 70, heartColor, 14, `stroke="${C.paper}" stroke-width="2"`),
    });
  },

  /* Three capsules at different heights in front of a big soft sun. */
  capsules({ bg, sun = C.signalSoft, files, ys = [190, 66, 330], sparkA = C.seal, sparkB = C.roseDeep, heartColor = C.roseDeep, wave = C.signal }) {
    const cw = 330;
    const gap = (W - 2 * M - 3 * cw) / 2;
    const ch = 1080;
    return compose({
      background: bg,
      under:
        `<circle cx="${W / 2}" cy="${H / 2 + 60}" r="470" fill="${sun}" fill-opacity=".55"/>` +
        dashedRing(W / 2, H / 2 + 60, 540, sun),
      panels: files.map((f, i) => panel(f, M + i * (cw + gap), ys[i], cw, ch, { shape: { type: 'capsule' } })),
      over:
        sparkle(M + cw + gap / 2, 120, 50, sparkA, 0) +
        sparkle(M + 2 * cw + gap * 1.5, 205, 30, sparkB, 0) +
        heart(M + cw / 2, ys[0] + ch + 90, 58, heartColor, -10) +
        squiggle(M + cw + gap + 30, ys[1] + ch + 80, 270, 14, 4, wave, 9, 0),
    });
  },

  /* Three instant photos taped on a board: two portraits, one landscape. */
  polaroids({ bg, pattern, cards, tapes = [C.roseLight, C.paperSage2, C.paper], heartColor = C.signal, sparkA = C.paper, sparkB = C.field }) {
    const spots = [
      { x: 70, y: 90, w: 560, h: 690, rotate: -7 },
      { x: 580, y: 230, w: 540, h: 670, rotate: 6 },
      { x: 170, y: 820, w: 800, h: 590, rotate: -2.5 },
    ];
    return compose({
      background: bg, pattern,
      panels: cards.map((c, i) => ({ polaroid: true, ...S(c), ...spots[i] })),
      over:
        tape(330, 92, 210, 56, -12, tapes[0]) +
        tape(870, 238, 190, 54, 9, tapes[1]) +
        tape(570, 830, 230, 58, -3, tapes[2], 0.75) +
        heart(1080, 1000, 74, heartColor, 12, `stroke="${C.paper}" stroke-width="2.5"`) +
        sparkle(90, 860, 56, sparkA, 0) +
        sparkle(140, 930, 26, sparkB, 0),
    });
  },

  /* Two full-bleed photos cut on the diagonal, stitched with hearts and sparkles. */
  diagonal({ bg = C.paper, top, bottom, heartColor = C.roseDeep, sparkColor = C.seal, ring = C.rose, motif = motifs.sparkle(C.signal) }) {
    const topPoly = [[0, 0], [W, 0], [W, 600], [0, 840]];
    const botPoly = [[0, 900 - 660], [W, 0], [W, H - 660], [0, H - 660]];
    let seam = '';
    for (let i = 0; i <= 6; i++) {
      const x = 90 + (i / 6) * (W - 180);
      const y = 870 - (x / W) * 240;
      seam += i % 2 ? sparkle(x, y, 26, sparkColor, 0) : heart(x, y, 30, heartColor, -11);
    }
    return compose({
      background: bg,
      panels: [
        panel(top, 0, 0, W, 840, { shape: { type: 'poly', points: topPoly }, shadow: false }),
        panel(bottom, 0, 660, W, H - 660, { shape: { type: 'poly', points: botPoly }, shadow: false }),
      ],
      over:
        `<polygon points="0,840 ${W},600 ${W},660 0,900" fill="${bg}"/>` +
        seam +
        sticker(W - 210, 300, 82, ring, motif(W - 210, 300)),
    });
  },

  /* Four photos around a paper heart. */
  mosaic({ bg, cells, wave = C.seal, ring = C.seal, heartColor = C.signal }) {
    const qw = (W - 2 * M - G) / 2;
    const qh = (H - 2 * M - G) / 2;
    return compose({
      background: bg,
      under: squiggle(M + 30, H / 2 + 2, W - 2 * M - 60, 9, 12, wave, 6, 0),
      panels: cells.map((c, i) => panel(c, M + (i % 2) * (qw + G), M + Math.floor(i / 2) * (qh + G), qw, qh, {
        shadow: { opacity: 0.22, dy: 14, blur: 16 },
      })),
      over: sticker(W / 2, H / 2, 96, ring, heart(W / 2, H / 2 + 4, 104, heartColor, 0)),
    });
  },

  /* Three wide bands that zig-zag, with a heart or a sparkle in each free corner. */
  bands({ bg, pattern, files, shift = 96, accents = [C.seal, C.signal, C.seal] }) {
    const bw = W - 2 * M - shift;
    const bh = Math.floor((H - 2 * M - 2 * G) / 3);
    const xs = [M, M + shift, M];
    const free = [W - M - shift / 2, M + shift / 2, W - M - shift / 2];
    let over = '';
    files.forEach((_, i) => {
      const y = M + i * (bh + G) + bh / 2;
      over += i % 2
        ? heart(free[i], y, 52, accents[i], -12) + sparkle(free[i], y - 90, 24, accents[0], 0)
        : sparkle(free[i], y, 56, accents[i], 0) + heart(free[i], y + 96, 26, accents[1], 10);
    });
    return compose({
      background: bg, pattern,
      panels: files.map((f, i) => panel(f, xs[i], M + i * (bh + G), bw, bh)),
      over,
    });
  },

  /* Three round photos of different sizes, floating like bubbles, with dotted orbits. */
  bubbles({ bg, pattern, files, orbit = C.seal, heartColor = C.signal, sparkA = C.seal, sparkB = C.roseDeep }) {
    const B = [
      { cx: 520, cy: 560, r: 380 },
      { cx: 860, cy: 1060, r: 270 },
      { cx: 330, cy: 1190, r: 195 },
    ];
    return compose({
      background: bg, pattern,
      under: dashedRing(B[0].cx, B[0].cy, B[0].r + 56, orbit, 5) + dashedRing(B[1].cx, B[1].cy, B[1].r + 46, orbit, 5),
      panels: B.map((b, i) => panel(files[i], b.cx - b.r, b.cy - b.r, 2 * b.r, 2 * b.r, {
        shape: { type: 'circle' }, ring: { width: 14, color: C.paper }, shadow: { opacity: 0.3 },
      })),
      over:
        sparkle(1040, 220, 64, sparkA, 0) +
        sparkle(1110, 320, 28, sparkB, 0) +
        heart(1010, 470, 60, heartColor, 12) +
        sparkle(600, 1380, 40, sparkA, 0) +
        heart(130, 860, 44, sparkB, -14),
    });
  },

  /* A full-bleed photo with a taped instant photo laid on top of it. */
  photoInPhoto({ back, inset, rotate = 5, tapeColor = C.roseLight, heartColor = C.signal }) {
    return compose({
      background: C.paper,
      panels: [
        panel(back, 0, 0, W, H, { shape: { type: 'rect', r: 0 }, shadow: false }),
        { polaroid: true, ...S(inset), x: 440, y: 760, w: 680, h: 590, rotate, bottom: 90 },
      ],
      over:
        tape(800, 772, 220, 58, -4, tapeColor) +
        heart(1100, 690, 70, heartColor, 14, `stroke="${C.paper}" stroke-width="3"`) +
        sparkle(410, 760, 46, C.paper, 0),
    });
  },

  /* A strip of film with three frames and sprocket holes, tilted on a sunny board. */
  async filmstrip({ bg, pattern, files, rotate = -4, strip = C.ink, sun = C.seal, heartColor = C.signal, sparkA = C.seal, sparkB = C.paper }) {
    const fw = 600;
    const fh = 380;
    const gap = 44;
    const side = 80;
    const pad = 56;
    const sw = fw + 2 * side;
    const sh = 2 * pad + 3 * fh + 2 * gap;
    let holes = '';
    for (let y = 26; y < sh - 40; y += 52) {
      holes += `<rect x="${side / 2 - 15}" y="${y}" width="30" height="22" rx="6" fill="${C.paper}" fill-opacity=".92"/>`;
      holes += `<rect x="${sw - side / 2 - 15}" y="${y}" width="30" height="22" rx="6" fill="${C.paper}" fill-opacity=".92"/>`;
    }
    const frames = await Promise.all(files.map((f) => {
      const { file, focus } = S(f);
      return shapedPhoto(file, fw, fh, { type: 'rect', r: 10 }, focus);
    }));
    const film = await sharp(svg(sw, sh, `<rect width="${sw}" height="${sh}" rx="18" fill="${strip}"/>${holes}`))
      .composite(frames.map((input, i) => ({ input, left: side, top: pad + i * (fh + gap) })))
      .png()
      .toBuffer();
    const x = (W - sw) / 2;
    const y = (H - sh) / 2;
    return compose({
      background: bg, pattern,
      under: `<circle cx="${W - 170}" cy="250" r="190" fill="${sun}"/>` + `<circle cx="160" cy="${H - 230}" r="130" fill="${sun}" fill-opacity=".55"/>`,
      panels: [{ layers: [await shadow(x, y, sw, sh, { type: 'rect', r: 18 }, { rotate, dy: 26, blur: 24, opacity: 0.42 }), await turned(film, rotate, W / 2, H / 2)] }],
      over:
        heart(W - 130, H - 240, 78, heartColor, 14, `stroke="${C.paper}" stroke-width="3"`) +
        sparkle(130, 170, 60, sparkA, 0) +
        sparkle(190, 250, 26, sparkB, 0),
    });
  },
};

/* ------------------------------------------------------------------ the sets */
const SETS = {
  /* The hero carousel: Station-Cœur and Les Précieuses, one after the other */
  hero: {
    sizes: [1200, 800],
    slides: [
      () => layouts.bigStack({
        bg: C.paperSage, pattern: { gap: 34, r: 3, color: C.sage, opacity: 0.35 },
        tall: ['galerie/boutique-13-1600.webp', { y: 0.45 }],
        top: ['station-coeur/gallery-21.webp', { y: 0.4 }],
        bottom: ['station-coeur/activity-24-jeux.webp', { x: 0.45 }],
        ring: C.sage, motif: motifs.heart(C.signal),
        decor: (g) => sparkle(g.sideX + g.sideW - 40, M + 70, 46, C.seal, 10) + sparkle(g.sideX + g.sideW - 92, M + 128, 22, C.paper, 0),
      }),
      () => layouts.diptych({
        bg: C.roseLight, pattern: { gap: 46, r: 6, color: C.rose, opacity: 0.45 },
        left: ['lesprecieuses/portant-vetements-colores-large.webp', { x: 0.55 }],
        right: ['lesprecieuses/vase-ceramique-tableau-large.webp', { x: 0.64, y: 0.42 }],
        decor: (g) =>
          sparkle(g.rx + 70, M + 52, 54, C.roseDeep, 0) + sparkle(g.rx + 132, M + 30, 26, C.seal, 0) +
          heart(M + g.pw - 70, H - M - 40, 52, C.roseDeep, -14) + heart(M + g.pw - 140, H - M - 18, 28, C.seal, 12),
      }),
      /* Featured (img/ 11.12.48): the sign going up in the station, in the station's own arch.
         The terrace that used to fill the arch moves to the round inset. */
      () => layouts.archCircle({
        bg: C.field,
        arch: ['station-coeur/activity-new-01.webp', { frame: true, x: 0.5, y: 0.5 }],
        circle: ['station-coeur/gallery-28.webp', { x: 0.42, y: 0.64, zoom: 1.6 }],
        inset: { cx: 960, cy: 270, r: 165 }, /* up on the ceiling, above her head */
      }),
      /* Featured (img/ 10.57.13 and 11.12.48 (1), (2)): the red clothes standing tall, the gift
         box and the tagged black shirt beside them. Coffret and shirt use the 1200 × 1600 WebP
         of the same photos, sharper than the screenshots. */
      () => layouts.bigStack({
        bg: C.paperCoral2, mirror: true, tallW: 582,
        under: squiggle(M + 10, H - 26, 520, 10, 6, C.rose, 6, 0) + squiggle(W - 560, 30, 520, 10, 6, C.rose, 6, 0),
        tall: ['station-coeur/boutique-new-01.webp', { x: 0.6 }],
        top: ['lesprecieuses/coffret-cadeau-bois-large.webp', { x: 0.45, y: 0.6, zoom: 1.15 }],
        bottom: ['lesprecieuses/chemise-noire-detail-large.webp', { x: 0.4, y: 0.45 }],
        ring: C.rose, motif: motifs.sparkle(C.seal),
        decor: (g) => heart(g.tallX + g.tallW - 80, M + 100, 56, C.paper, 10) + sparkle(g.tallX + g.tallW - 140, M + 160, 24, C.seal, 0),
      }),
      () => layouts.polaroids({
        bg: C.seal, pattern: { gap: 40, r: 3.5, color: C.sealInk, opacity: 0.45 },
        cards: [
          ['station-coeur/gallery-40.webp', { y: 0.45 }],
          ['station-coeur/gallery-27.webp', { y: 0.35 }],
          ['galerie/boutique-12-1600.webp', { y: 0.45 }],
        ],
      }),
      () => layouts.diagonal({
        top: 'lesprecieuses/objets-decoratifs-vintage-large.webp',
        bottom: 'lesprecieuses/tiroir-bijoux-large.webp',
      }),
      () => layouts.mosaic({
        bg: C.paper,
        cells: [
          ['station-coeur/gallery-34.webp', { y: 0.45 }],
          ['galerie/boutique-07-1600.webp', { y: 0.45 }],
          ['galerie/boutique-11-1600.webp', { y: 0.55 }],
          'station-coeur/gallery-39.webp',
        ],
      }),
      /* Moved from slide 4 to make room for the featured trio */
      () => layouts.capsules({
        bg: C.paperCoral,
        files: [
          'lesprecieuses/vetements-soie-rose-large.webp',
          ['lesprecieuses/bijoux-boucles-oreilles-large.webp', { y: 0.45 }],
          ['lesprecieuses/lampes-orange-retro-large.webp', { x: 0.42, y: 0.4 }],
        ],
      }),
    ],
  },

  /* Les Précieuses, as installed in a company */
  showcase: {
    sizes: [1200, 800],
    slides: [
      () => layouts.archCircle({
        bg: C.roseDeep, sun: C.seal, halo: C.roseLight, wave: C.rose, heartColor: C.seal, sparkA: C.roseLight,
        arch: ['station-coeur/boutique-new-06.webp', { x: 0.5, y: 0.55 }],
        circle: ['station-coeur/boutique-new-04.webp', { x: 0.42, y: 0.4, zoom: 1.5 }],
      }),
      () => layouts.diptych({
        bg: C.paperCoral, pattern: { gap: 46, r: 6, color: C.signalSoft, opacity: 0.6 },
        left: ['station-coeur/boutique-new-01.webp', { x: 0.45 }],
        right: ['station-coeur/boutique-new-02.webp', { x: 0.6 }],
        decor: (g) =>
          sparkle(g.rx + 70, M + 52, 54, C.signal, 0) + sparkle(g.rx + 132, M + 30, 26, C.seal, 0) +
          heart(M + g.pw - 70, H - M - 40, 52, C.signal, -14) + heart(M + g.pw - 140, H - M - 18, 28, C.seal, 12),
      }),
      () => layouts.polaroids({
        bg: C.rose, pattern: { gap: 40, r: 3.5, color: C.roseDeep, opacity: 0.4 },
        tapes: [C.paperSage2, C.seal, C.paper], heartColor: C.seal, sparkB: C.roseDeep,
        cards: [
          ['station-coeur/boutique-new-03.webp', { x: 0.62, y: 0.45 }],
          ['station-coeur/boutique-new-05.webp', { x: 0.62, y: 0.4 }],
          ['station-coeur/boutique-new-07.webp', { x: 0.55, y: 0.42, zoom: 1.5 }],
        ],
      }),
      () => layouts.bigStack({
        bg: C.roseLight, pattern: { gap: 46, r: 6, color: C.rose, opacity: 0.4 },
        mirror: true, tallW: 582, tallShape: ARCH,
        tall: ['lesprecieuses/etageres-decoration-large.webp', { y: 0.45 }],
        top: 'lesprecieuses/bijoux-vue-dessus-large.webp',
        bottom: ['station-coeur/boutique-new-08.webp', { x: 0.42, y: 0.82, zoom: 2.2 }],
        ring: C.rose, motif: motifs.heart(C.signal),
        decor: (g) => sparkle(g.tallX + g.tallW - 80, M + 110, 52, C.paper, 0) + sparkle(g.tallX + g.tallW - 130, M + 175, 22, C.seal, 0),
      }),
    ],
  },

  /* The photo gallery: every photo it used to show, now in collages */
  galerie: {
    sizes: [1000, 600],
    slides: [
      () => layouts.bigStack({
        bg: C.paperSage, pattern: { gap: 34, r: 3, color: C.sage, opacity: 0.35 },
        tall: ['galerie/boutique-15-1600.webp', { y: 0.5 }],
        top: ['station-coeur/gallery-21.webp', { y: 0.45 }],
        bottom: ['galerie/boutique-06-1600.webp', { x: 0.45 }],
        ring: C.sage, motif: motifs.heart(C.signal),
        decor: (g) => sparkle(g.sideX + g.sideW - 40, M + 70, 46, C.seal, 10),
      }),
      () => layouts.capsules({
        bg: C.paperCoral,
        files: [
          ['galerie/boutique-10-1600.webp', { y: 0.45 }],
          ['galerie/boutique-14-1600.webp', { y: 0.45 }],
          ['galerie/boutique-09-1600.webp', { y: 0.4 }],
        ],
      }),
      () => layouts.archCircle({
        bg: C.field,
        arch: ['station-coeur/activity-13.webp', { x: 0.42, y: 0.5 }],
        circle: ['station-coeur/activity-new-01.webp', { frame: true, x: 0.66, y: 0.42, zoom: 1.15 }], /* featured photo, sharper than gallery-37 */
      }),
      () => layouts.diptych({
        bg: C.roseLight, pattern: { gap: 46, r: 6, color: C.rose, opacity: 0.45 }, stagger: 90,
        left: ['galerie/boutique-04-1600.webp', { y: 0.5 }],
        right: ['galerie/boutique-08-1600.webp', { y: 0.4 }],
        decor: (g) =>
          sparkle(g.rx + 70, M + 45, 50, C.roseDeep, 0) + sparkle(g.rx + 128, M + 26, 22, C.seal, 0) +
          heart(M + g.pw - 70, H - M - 34, 48, C.roseDeep, -14),
      }),
      () => layouts.polaroids({
        bg: C.seal, pattern: { gap: 40, r: 3.5, color: C.sealInk, opacity: 0.45 },
        cards: [
          ['galerie/boutique-01-1600.webp', { y: 0.4 }],
          ['station-coeur/gallery-26.webp', { y: 0.4 }],
          ['galerie/boutique-16-1600.webp', { y: 0.45 }],
        ],
      }),
      () => layouts.diagonal({
        bg: C.paperSage, heartColor: C.signal, ring: C.sage, motif: motifs.heart(C.signal),
        top: 'lesprecieuses/objets-decoratifs-vintage-large.webp',
        bottom: ['lesprecieuses/lampes-orange-retro-large.webp', { y: 0.5 }],
      }),
      () => layouts.bands({
        bg: C.paperSage2, pattern: { gap: 36, r: 3, color: C.sage, opacity: 0.35 },
        files: [
          ['station-coeur/activity-29.webp', { y: 0.5 }],
          ['galerie/boutique-03-1600.webp', { y: 0.35 }],
          ['galerie/boutique-05-1600.webp', { y: 0.55 }],
        ],
      }),
      () => layouts.bubbles({
        bg: C.paperCoral2,
        files: [
          ['station-coeur/activity-24-jeux.webp', { x: 0.45 }],
          ['station-coeur/gallery-27.webp', { y: 0.32 }],
          ['station-coeur/gallery-31.webp', { y: 0.38 }],
        ],
      }),
      () => layouts.photoInPhoto({
        back: ['galerie/boutique-02-1600.webp', { y: 0.45 }],
        inset: ['galerie/boutique-12-1600.webp', { y: 0.45 }],
      }),
      () => layouts.filmstrip({
        bg: C.paperSage, pattern: { gap: 40, r: 3.5, color: C.sage, opacity: 0.35 },
        files: [
          ['station-coeur/gallery-32.webp', { y: 0.55 }],
          ['lesprecieuses/coffret-cadeau-bois-large.webp', { x: 0.45, y: 0.5, zoom: 1.2 }],
          ['lesprecieuses/chemise-noire-detail-large.webp', { y: 0.42 }],
        ],
      }),
      () => layouts.mosaic({
        bg: C.paper, wave: C.sage, ring: C.sage,
        cells: [
          ['galerie/boutique-11-1600.webp', { y: 0.55 }],
          ['galerie/boutique-07-1600.webp', { y: 0.45 }],
          ['station-coeur/gallery-49.webp', { y: 0.5 }],
          ['station-coeur/gallery-40.webp', { y: 0.45 }],
        ],
      }),
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
      const png = await slides[i]();
      for (const size of sizes) {
        const info = await sharp(png)
          .resize(size, Math.round((size * H) / W))
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
