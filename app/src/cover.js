// The cover engine: panel geometry, colour grades, lettering and poster
// dressing, and the one render function the editor uses for both the live
// preview and the exported PNG, so what you see is what you share.

export const SIZES = [
  { id: 'wide', name: '1920 × 1080 (wide)', w: 1920, h: 1080 },
  { id: 'square', name: '1080 × 1080 (square)', w: 1080, h: 1080 },
  { id: 'portrait', name: '1080 × 1350 (portrait)', w: 1080, h: 1350 },
];

export const LAYOUTS = [
  { id: 'hero', name: 'Hero Split' },
  { id: 'four', name: 'Four Panel' },
  { id: 'nine', name: 'Nine Panel' },
  { id: 'tilted', name: 'Tilted Snapshots' },
  { id: 'bleed', name: 'Full Bleed' },
  { id: 'trio', name: 'Strip Trio' },
];

export const GRADES = [
  {
    id: 'vice', name: 'Vice Sunset', swatch: '#ff7e29',
    filter: 'saturate(1.35) contrast(1.08) brightness(1.04)',
    titleA: '#ffd23f', titleB: '#ff4e8a', accent: '#22d3ee',
  },
  {
    id: 'neon', name: 'Neon Night', swatch: '#22d3ee',
    filter: 'saturate(1.5) contrast(1.16) brightness(0.97) hue-rotate(-10deg)',
    titleA: '#7df9ff', titleB: '#ff4e8a', accent: '#ffd23f',
  },
  {
    id: 'gold', name: 'Palm Gold', swatch: '#ffb347',
    filter: 'sepia(0.35) saturate(1.3) contrast(1.06) brightness(1.05)',
    titleA: '#fff3b0', titleB: '#ff9e2c', accent: '#c9184a',
  },
  {
    id: 'teal', name: 'Teal Heat', swatch: '#0e7c86',
    filter: 'saturate(1.22) contrast(1.13) brightness(1.0)',
    titleA: '#ffe8d6', titleB: '#ff7e29', accent: '#2ec4b6',
  },
  {
    id: 'noir', name: 'Noir Pop', swatch: '#e63946',
    filter: 'grayscale(0.85) contrast(1.32) brightness(1.03)',
    titleA: '#ffffff', titleB: '#c9ced6', accent: '#e63946',
  },
];

export function gradeOf(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

export function sizeOf(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

// The photo panels of a layout as pixel rects inside a W x H cover, with a
// gutter between them. For 'nine', index 4 is the centre title tile.
export function panelRects(layout, W, H) {
  const g = Math.round(Math.min(W, H) * 0.014);
  const half = (a, b) => Math.floor((b - a - g) / 2);
  if (layout === 'four') {
    const w = half(0, W);
    const h = half(0, H);
    return [
      { x: 0, y: 0, w, h },
      { x: w + g, y: 0, w: W - w - g, h },
      { x: 0, y: h + g, w, h: H - h - g },
      { x: w + g, y: h + g, w: W - w - g, h: H - h - g },
    ];
  }
  if (layout === 'nine') {
    const w = Math.floor((W - 2 * g) / 3);
    const h = Math.floor((H - 2 * g) / 3);
    const out = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        out.push({
          x: c * (w + g),
          y: r * (h + g),
          w: c === 2 ? W - 2 * (w + g) : w,
          h: r === 2 ? H - 2 * (h + g) : h,
        });
      }
    }
    return out;
  }
  if (layout === 'trio') {
    const w = Math.floor((W - 2 * g) / 3);
    return [0, 1, 2].map((i) => ({
      x: i * (w + g),
      y: 0,
      w: i === 2 ? W - 2 * (w + g) : w,
      h: H,
    }));
  }
  if (layout === 'bleed') return [{ x: 0, y: 0, w: W, h: H }];
  if (layout === 'tilted') return [];
  // hero: one tall panel on the left, two stacked on the right.
  const lw = Math.floor(W * 0.56);
  const rw = W - lw - g;
  const th = half(0, H);
  return [
    { x: 0, y: 0, w: lw, h: H },
    { x: lw + g, y: 0, w: rw, h: th },
    { x: lw + g, y: th + g, w: rw, h: H - th - g },
  ];
}

// The snapshot frames of the tilted layout: centre, size and rotation.
export function tiltedFrames(W, H) {
  return [
    { cx: W * 0.3, cy: H * 0.4, w: W * 0.5, h: H * 0.58, rot: -0.1 },
    { cx: W * 0.7, cy: H * 0.36, w: W * 0.44, h: H * 0.52, rot: 0.09 },
    { cx: W * 0.52, cy: H * 0.68, w: W * 0.48, h: H * 0.5, rot: -0.03 },
  ];
}

// Draw one photo into a rect, cover-fitted, with the panel's zoom and pan and
// the grade's photo filter. A missing photo becomes a labelled placeholder.
function drawPhoto(ctx, img, rect, t, filter) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (img) {
    const iw = img.width;
    const ih = img.height;
    const scale = Math.max(rect.w / iw, rect.h / ih) * (t?.zoom ?? 1);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = rect.x + (rect.w - dw) / 2 + ((t?.panX ?? 0) / 100) * rect.w * 0.5;
    const dy = rect.y + (rect.h - dh) / 2 + ((t?.panY ?? 0) / 100) * rect.h * 0.5;
    ctx.filter = filter;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.filter = 'none';
  } else {
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
    grad.addColorStop(0, '#3a1560');
    grad.addColorStop(1, '#8e1e63');
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.75)';
    ctx.font = `600 ${Math.max(14, Math.min(rect.w, rect.h) * 0.07)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('ADD A PHOTO', rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.restore();
}

// The grade's unifying wash over the whole cover: tinted gradients laid over
// the panels so separate photos read as one poster.
function applyGradeWash(ctx, W, H, grade) {
  ctx.save();
  if (grade.id === 'vice') {
    const top = ctx.createLinearGradient(0, 0, 0, H);
    top.addColorStop(0, 'rgba(43,10,74,0.34)');
    top.addColorStop(0.45, 'rgba(43,10,74,0)');
    top.addColorStop(1, 'rgba(255,110,30,0.26)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = top;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255,78,138,0.5)';
    ctx.fillRect(0, 0, W, H);
  } else if (grade.id === 'neon') {
    const side = ctx.createLinearGradient(0, 0, W, 0);
    side.addColorStop(0, 'rgba(34,211,238,0.3)');
    side.addColorStop(0.5, 'rgba(0,0,0,0)');
    side.addColorStop(1, 'rgba(255,78,138,0.3)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = side;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(20,20,80,0.55)';
    ctx.fillRect(0, 0, W, H);
  } else if (grade.id === 'gold') {
    const warm = ctx.createLinearGradient(0, 0, 0, H);
    warm.addColorStop(0, 'rgba(255,179,71,0.16)');
    warm.addColorStop(1, 'rgba(146,64,14,0.3)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = warm;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(255,190,80,0.5)';
    ctx.fillRect(0, 0, W, H);
  } else if (grade.id === 'teal') {
    const split = ctx.createLinearGradient(0, 0, 0, H);
    split.addColorStop(0, 'rgba(255,126,41,0.2)');
    split.addColorStop(0.55, 'rgba(0,0,0,0)');
    split.addColorStop(1, 'rgba(14,124,134,0.38)');
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = split;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(46,196,182,0.35)';
    ctx.fillRect(0, 0, W, H);
  } else {
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = 'rgba(20,20,26,0.35)';
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = 'rgba(230,57,70,0.28)';
    ctx.fillRect(0, H * 0.62, W, H * 0.38);
  }
  ctx.restore();
}

// A halftone dot band behind the lettering: rows of dots shrinking as they
// fall, in the grade's accent colour.
function drawHalftoneBand(ctx, x, y, w, h, colour) {
  ctx.save();
  ctx.fillStyle = colour;
  const step = h / 5;
  for (let row = 0; row < 5; row++) {
    const r = step * 0.3 * (1 - row * 0.16);
    for (let cx = x + step / 2; cx < x + w; cx += step) {
      ctx.globalAlpha = 0.34 - row * 0.05;
      ctx.beginPath();
      ctx.arc(cx, y + step * (row + 0.5), r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Fit Anton to a width: shrink from `start` until the text fits `maxW`.
function fitFont(ctx, text, start, maxW, family) {
  let size = start;
  ctx.font = `${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxW) {
    size *= 0.94;
    ctx.font = `${size}px ${family}`;
  }
  return size;
}

// The title block: halftone band, the block title with a sunset gradient fill
// and a hard offset shadow, and the script subtitle under it. Drawn inside
// the rect it is given (a cover band, or the nine-panel centre tile).
export function drawTitleBlock(ctx, rect, state, grade) {
  const title = (state.title || '').trim();
  const subtitle = (state.subtitle || '').trim();
  drawHalftoneBand(ctx, rect.x, rect.y, rect.w, rect.h, grade.accent);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  if (title) {
    const size = fitFont(ctx, title.toUpperCase(), rect.h * 0.44, rect.w * 0.94, 'Anton, sans-serif');
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h * (subtitle ? 0.4 : 0.5);
    const fill = ctx.createLinearGradient(0, cy - size / 2, 0, cy + size / 2);
    fill.addColorStop(0, grade.titleA);
    fill.addColorStop(1, grade.titleB);
    ctx.font = `${size}px Anton, sans-serif`;
    ctx.fillStyle = 'rgba(13,5,24,0.9)';
    ctx.fillText(title.toUpperCase(), cx + size * 0.055, cy + size * 0.06);
    ctx.lineWidth = size * 0.1;
    ctx.strokeStyle = '#160a24';
    ctx.strokeText(title.toUpperCase(), cx, cy);
    ctx.fillStyle = fill;
    ctx.fillText(title.toUpperCase(), cx, cy);
    if (subtitle) {
      const sub = fitFont(ctx, subtitle, size * 0.44, rect.w * 0.9, 'Pacifico, cursive');
      ctx.font = `${sub}px Pacifico, cursive`;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = sub * 0.16;
      ctx.fillText(subtitle, cx, rect.y + rect.h * 0.76);
      ctx.shadowBlur = 0;
    }
  } else if (subtitle) {
    const sub = fitFont(ctx, subtitle, rect.h * 0.3, rect.w * 0.9, 'Pacifico, cursive');
    ctx.font = `${sub}px Pacifico, cursive`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(subtitle, rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.restore();
}

// The badge ribbon across the top-right corner.
function drawRibbon(ctx, W, H, state, grade) {
  const badge = (state.badge || '').trim();
  if (!badge) return;
  const band = Math.min(W, H) * 0.052;
  const reach = Math.min(W, H) * 0.17;
  ctx.save();
  ctx.translate(W - reach, reach);
  ctx.rotate(Math.PI / 4);
  const grad = ctx.createLinearGradient(-reach, 0, reach, 0);
  grad.addColorStop(0, grade.titleB);
  grad.addColorStop(1, grade.titleA);
  ctx.fillStyle = grad;
  ctx.fillRect(-reach * 1.5, -band / 2, reach * 3, band);
  ctx.fillStyle = '#160a24';
  ctx.font = `${band * 0.52}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(badge.toUpperCase(), 0, band * 0.04);
  ctx.restore();
}

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// The five-star heat meter, bottom-left.
function drawHeatMeter(ctx, W, H, state, grade) {
  const heat = Math.max(0, Math.min(5, state.heat | 0));
  if (heat === 0) return;
  const r = Math.min(W, H) * 0.021;
  const x0 = r * 1.7;
  const y = H - r * 1.9;
  ctx.save();
  for (let i = 0; i < 5; i++) {
    starPath(ctx, x0 + i * r * 2.5, y, r);
    if (i < heat) {
      ctx.fillStyle = grade.titleA;
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.65)';
      ctx.lineWidth = r * 0.14;
      ctx.stroke();
    }
  }
  ctx.restore();
}

let grainCanvas = null;
function getGrain() {
  if (grainCanvas) return grainCanvas;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 256;
  const g = c.getContext('2d');
  const img = g.createImageData(256, 256);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + Math.random() * 90;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  grainCanvas = c;
  return c;
}

// Film grain and a vignette over everything, then the poster frame.
function drawFinish(ctx, W, H) {
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(getGrain(), 'repeat');
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
  vig.addColorStop(0, 'rgba(10,2,20,0)');
  vig.addColorStop(1, 'rgba(10,2,20,0.42)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
  const edge = Math.max(6, Math.min(W, H) * 0.012);
  ctx.strokeStyle = '#0d0518';
  ctx.lineWidth = edge;
  ctx.strokeRect(edge / 2, edge / 2, W - edge, H - edge);
  ctx.strokeStyle = 'rgba(255,210,63,0.85)';
  ctx.lineWidth = Math.max(2, edge * 0.22);
  ctx.strokeRect(edge * 1.15, edge * 1.15, W - edge * 2.3, H - edge * 2.3);
}

// The tilted layout: polaroid-style snapshots rotated over a tinted backdrop.
function drawTilted(ctx, W, H, state, grade) {
  const back = ctx.createLinearGradient(0, 0, W, H);
  back.addColorStop(0, '#1d0b38');
  back.addColorStop(0.55, '#3d1155');
  back.addColorStop(1, '#120724');
  ctx.fillStyle = back;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.78, H * 0.2, 10, W * 0.78, H * 0.2, W * 0.5);
  glow.addColorStop(0, 'rgba(255,126,41,0.4)');
  glow.addColorStop(1, 'rgba(255,126,41,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  const frames = tiltedFrames(W, H);
  frames.forEach((f, i) => {
    const panel = state.panels[i] ?? { source: i, zoom: 1, panX: 0, panY: 0 };
    const img = state.sources[panel.source] ?? null;
    const margin = f.w * 0.045;
    const foot = f.h * 0.16;
    ctx.save();
    ctx.translate(f.cx, f.cy);
    ctx.rotate(f.rot);
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = Math.min(W, H) * 0.03;
    ctx.shadowOffsetY = Math.min(W, H) * 0.014;
    ctx.fillStyle = '#fdfbf6';
    ctx.fillRect(-f.w / 2, -f.h / 2, f.w, f.h + foot);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    drawPhoto(ctx, img, { x: -f.w / 2 + margin, y: -f.h / 2 + margin, w: f.w - margin * 2, h: f.h - margin * 2 }, panel, grade.filter);
    ctx.restore();
  });
}

// Render the whole cover into `canvas` at the state's post size. `sources`
// in the state are the six photo sources (four slots, then the two sample
// scenes); each entry is an image or canvas, or null for an empty slot.
export function renderCover(canvas, state) {
  const { w: W, h: H } = sizeOf(state.size);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = gradeOf(state.grade);
  ctx.fillStyle = '#120724';
  ctx.fillRect(0, 0, W, H);

  if (state.layout === 'tilted') {
    drawTilted(ctx, W, H, state, grade);
    applyGradeWash(ctx, W, H, grade);
    const bandH = H * 0.2;
    drawTitleBlock(ctx, { x: W * 0.08, y: H - bandH - H * 0.02, w: W * 0.84, h: bandH }, state, grade);
  } else {
    const rects = panelRects(state.layout, W, H);
    rects.forEach((rect, i) => {
      if (state.layout === 'nine' && i === 4) {
        ctx.fillStyle = '#160a24';
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
        return;
      }
      const panel = state.panels[i] ?? { source: i % 6, zoom: 1, panX: 0, panY: 0 };
      const img = state.sources[panel.source] ?? null;
      drawPhoto(ctx, img, rect, panel, grade.filter);
      ctx.strokeStyle = 'rgba(10,3,20,0.85)';
      ctx.lineWidth = Math.max(2, Math.min(W, H) * 0.004);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    });
    applyGradeWash(ctx, W, H, grade);
    if (state.layout === 'nine') {
      drawTitleBlock(ctx, rects[4], state, grade);
    } else {
      const bandH = H * 0.21;
      ctx.save();
      const fade = ctx.createLinearGradient(0, H - bandH, 0, H);
      fade.addColorStop(0, 'rgba(10,3,20,0)');
      fade.addColorStop(0.45, 'rgba(10,3,20,0.55)');
      fade.addColorStop(1, 'rgba(10,3,20,0.82)');
      ctx.fillStyle = fade;
      ctx.fillRect(0, H - bandH, W, bandH);
      ctx.restore();
      drawTitleBlock(ctx, { x: W * 0.05, y: H - bandH, w: W * 0.9, h: bandH }, state, grade);
    }
  }

  drawRibbon(ctx, W, H, state, grade);
  drawHeatMeter(ctx, W, H, state, grade);
  drawFinish(ctx, W, H);
  return canvas;
}
