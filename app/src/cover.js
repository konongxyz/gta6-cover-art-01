// Neon Coast Cover Studio — the cover engine.
// Draws the multi-panel sunset/neon poster onto any 2D canvas context, at any
// size, from a plain state object. Deterministic: the grain uses a fixed seed,
// so the same state always paints the same bytes.

export const LAYOUTS = [
  { id: 'hero', name: 'Hero Split' },
  { id: 'four', name: 'Four Panel' },
  { id: 'nine', name: 'Nine Panel' },
  { id: 'tilted', name: 'Tilted Snapshots' },
  { id: 'bleed', name: 'Full Bleed' },
  { id: 'strip', name: 'Strip Trio' },
];

export const GRADES = [
  { id: 'vice', name: 'Vice Sunset', sky: '#ff7a3d', mid: '#ff2e88', deep: '#2b1055', ink: '#1a0b2e', accent: '#ffd166', title: '#ffffff' },
  { id: 'neon', name: 'Neon Night', sky: '#ff2e88', mid: '#7b2ff7', deep: '#0b1035', ink: '#05081f', accent: '#2de2ff', title: '#ffffff' },
  { id: 'palm', name: 'Palm Gold', sky: '#ffb347', mid: '#ff7b2f', deep: '#3d1c00', ink: '#241203', accent: '#fff3b0', title: '#fff8e7' },
  { id: 'teal', name: 'Teal Heat', sky: '#2de2ff', mid: '#ff5e78', deep: '#062a33', ink: '#04222b', accent: '#ff9e5e', title: '#ffffff' },
  { id: 'noir', name: 'Noir Pop', sky: '#e8e8e8', mid: '#ff2e4d', deep: '#0a0a0a', ink: '#000000', accent: '#ff2e4d', title: '#ffffff' },
];

export const SIZES = [
  { id: 'square', name: 'Square 1080 x 1080', w: 1080, h: 1080 },
  { id: 'portrait', name: 'Portrait 1080 x 1350', w: 1080, h: 1350 },
  { id: 'wide', name: 'Wide 1920 x 1080', w: 1920, h: 1080 },
];

/** A fresh default state: title, subtitle, badge, heat, layout, grade, size and 4 photo slots. */
export function defaultState() {
  return {
    layout: 'hero',
    grade: 'vice',
    size: 'square',
    title: 'NEON COAST',
    subtitle: 'sunset streets, neon nights',
    badge: 'EST. 2026',
    heat: 4,
    grain: true,
    frame: true,
    photos: [
      { img: null, zoom: 1, panX: 0, panY: 0 },
      { img: null, zoom: 1, panX: 0, panY: 0 },
      { img: null, zoom: 1, panX: 0, panY: 0 },
      { img: null, zoom: 1, panX: 0, panY: 0 },
    ],
  };
}

/** A tiny seeded generator, so the grain is identical on every render. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Panel rectangles for a layout, in cover coordinates. Each panel names its photo slot. */
export function layoutPanels(layout, w, h) {
  const gap = Math.round(w * 0.012);
  const band = Math.round(h * 0.24);
  const body = layout === 'nine' ? h : h - band; // nine-panel fills the whole cover; its title is the middle tile
  switch (layout) {
    case 'hero':
      return [
        { x: 0, y: 0, w: Math.round(w * 0.62), h: body, photo: 0 },
        { x: Math.round(w * 0.62) + gap, y: 0, w: w - Math.round(w * 0.62) - gap, h: Math.round(body * 0.52), photo: 1 },
        { x: Math.round(w * 0.62) + gap, y: Math.round(body * 0.52) + gap, w: w - Math.round(w * 0.62) - gap, h: body - Math.round(body * 0.52) - gap, photo: 2 },
      ];
    case 'four':
      return [
        { x: 0, y: 0, w: Math.round(w / 2) - gap / 2, h: Math.round(body / 2) - gap / 2, photo: 0 },
        { x: Math.round(w / 2) + gap / 2, y: 0, w: w - Math.round(w / 2) - gap / 2, h: Math.round(body / 2) - gap / 2, photo: 1 },
        { x: 0, y: Math.round(body / 2) + gap / 2, w: Math.round(w / 2) - gap / 2, h: body - Math.round(body / 2) - gap / 2, photo: 2 },
        { x: Math.round(w / 2) + gap / 2, y: Math.round(body / 2) + gap / 2, w: w - Math.round(w / 2) - gap / 2, h: body - Math.round(body / 2) - gap / 2, photo: 3 },
      ];
    case 'nine': {
      const cw = (w - gap * 2) / 3;
      const ch = (body - gap * 2) / 3;
      const panels = [];
      let slot = 0;
      for (let r = 0; r < 3; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          if (r === 1 && c === 1) continue; // the middle tile is the title block
          panels.push({ x: Math.round(c * (cw + gap)), y: Math.round(r * (ch + gap)), w: Math.round(cw), h: Math.round(ch), photo: slot % 4 });
          slot += 1;
        }
      }
      return panels;
    }
    case 'tilted':
      return [
        { x: Math.round(w * 0.06), y: Math.round(h * 0.05), w: Math.round(w * 0.4), h: Math.round(body * 0.62), photo: 0, rot: -0.07 },
        { x: Math.round(w * 0.52), y: Math.round(h * 0.03), w: Math.round(w * 0.42), h: Math.round(body * 0.62), photo: 1, rot: 0.06 },
        { x: Math.round(w * 0.28), y: Math.round(h * 0.42), w: Math.round(w * 0.44), h: Math.round(body * 0.4), photo: 2, rot: -0.02 },
      ];
    case 'bleed':
      return [{ x: 0, y: 0, w, h: body, photo: 0 }];
    case 'strip':
      return [
        { x: 0, y: 0, w: Math.round(w / 3) - gap / 2, h: body, photo: 0 },
        { x: Math.round(w / 3) + gap / 2, y: 0, w: Math.round(w / 3) - gap, h: body, photo: 1 },
        { x: Math.round((w * 2) / 3) + gap / 2, y: 0, w: w - Math.round((w * 2) / 3) - gap / 2, h: body, photo: 2 },
      ];
    default:
      return [{ x: 0, y: 0, w, h: body, photo: 0 }];
  }
}

/** The title band rectangle for a layout (null for nine-panel: its title lives in the middle tile). */
export function titleBand(layout, w, h) {
  if (layout === 'nine') return null;
  const band = Math.round(h * 0.24);
  return { x: 0, y: h - band, w, h: band };
}

/** Paints one photo into a panel rect, cover-fit, with the slot's zoom and pan. */
export function drawPhotoInto(ctx, img, rect, slot) {
  if (!img) return false;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(rect.w / iw, rect.h / ih);
  const scale = base * (slot.zoom || 1);
  const sw = iw * scale;
  const sh = ih * scale;
  const dx = rect.x + (rect.w - sw) / 2 + (slot.panX || 0) * rect.w;
  const dy = rect.y + (rect.h - sh) / 2 + (slot.panY || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, sw, sh);
  ctx.restore();
  return true;
}

/** A generated sunset-street placeholder: gradient sky, sun, palms and a road — no borrowed art. */
export function drawPlaceholder(ctx, rect, seed) {
  const rand = mulberry32(seed);
  const sky = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  sky.addColorStop(0, '#2b1055');
  sky.addColorStop(0.45, '#ff2e88');
  sky.addColorStop(0.75, '#ff7a3d');
  sky.addColorStop(1, '#ffd166');
  ctx.fillStyle = sky;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  const sunX = rect.x + rect.w * (0.3 + rand() * 0.4);
  const sunY = rect.y + rect.h * 0.42;
  const sunR = rect.w * 0.16;
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(43, 16, 85, 0.55)';
  for (let i = 0; i < 5; i += 1) {
    const y = sunY + sunR * 0.1 + i * (sunR * 0.22);
    ctx.fillRect(rect.x, y, rect.w, sunR * 0.07);
  }
  // Palm silhouettes on both sides.
  ctx.strokeStyle = '#1a0b2e';
  ctx.lineWidth = Math.max(3, rect.w * 0.012);
  ctx.lineCap = 'round';
  for (const side of [0, 1]) {
    const bx = side === 0 ? rect.x + rect.w * 0.08 : rect.x + rect.w * 0.92;
    const by = rect.y + rect.h;
    const tx = bx + (side === 0 ? rect.w * 0.12 : -rect.w * 0.12);
    const ty = rect.y + rect.h * 0.45;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx, rect.y + rect.h * 0.7, tx, ty);
    ctx.stroke();
    for (let f = 0; f < 5; f += 1) {
      const a = (-0.3 - f * 0.35) * (side === 0 ? 1 : -1);
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + Math.cos(a) * rect.w * 0.14, ty + Math.sin(a) * rect.h * 0.08 - rect.h * 0.05, tx + Math.cos(a) * rect.w * 0.2, ty + Math.sin(a) * rect.h * 0.14);
      ctx.stroke();
    }
  }
  // Wet road at the bottom, catching the sun.
  ctx.fillStyle = '#160a26';
  ctx.beginPath();
  ctx.moveTo(rect.x, rect.y + rect.h);
  ctx.lineTo(rect.x + rect.w * 0.36, sunY + sunR * 0.4);
  ctx.lineTo(rect.x + rect.w * 0.64, sunY + sunR * 0.4);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 209, 102, 0.7)';
  for (let i = 0; i < 4; i += 1) {
    const t = i / 4;
    const y = rect.y + rect.h * (0.72 + t * 0.24);
    const ww = rect.w * (0.008 + t * 0.02);
    ctx.fillRect(rect.x + rect.w / 2 - ww / 2, y, ww, rect.h * 0.03);
  }
}

/** Fits a font size so the text fits the width, then draws it centred. */
export function fitText(ctx, text, cx, y, maxW, startSize, font) {
  let size = startSize;
  ctx.font = font(size);
  while (size > 10 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = font(size);
  }
  ctx.fillText(text, cx, y);
  return size;
}

/** The 5-star heat meter, filled stars in the grade accent. */
export function drawHeatMeter(ctx, cx, y, heat, starR, accent) {
  const gap = starR * 2.4;
  const x0 = cx - ((5 - 1) * gap) / 2;
  for (let i = 0; i < 5; i += 1) {
    const x = x0 + i * gap;
    ctx.beginPath();
    for (let p = 0; p < 10; p += 1) {
      const r = p % 2 === 0 ? starR : starR * 0.45;
      const a = -Math.PI / 2 + (p * Math.PI) / 5;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (p === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = i < heat ? accent : 'rgba(255, 255, 255, 0.25)';
    ctx.fill();
  }
}

/** A rotated ribbon badge in the top corner. */
export function drawBadge(ctx, text, w, grade) {
  const size = Math.round(w * 0.032);
  ctx.save();
  ctx.translate(w - size * 2.7, size * 1.05);
  ctx.rotate(0.1);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(-size * 2.2, -size * 0.62, size * 4.4, size * 1.24);
  ctx.fillStyle = grade.ink;
  ctx.font = `bold ${Math.round(size * 0.52)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Halftone dots fading down inside the title band. */
export function drawHalftone(ctx, band, grade) {
  const step = Math.max(10, Math.round(band.w * 0.014));
  ctx.fillStyle = grade.accent;
  for (let y = band.y + step; y < band.y + band.h * 0.5; y += step) {
    const fade = 1 - (y - band.y) / (band.h * 0.5);
    for (let x = band.x + step / 2; x < band.x + band.w; x += step) {
      ctx.globalAlpha = 0.28 * fade;
      ctx.beginPath();
      ctx.arc(x, y, step * 0.16 * fade + 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

/** Film grain: fixed-seed specks over the whole cover. */
export function drawGrain(ctx, w, h) {
  const rand = mulberry32(20261119);
  const count = Math.round((w * h) / 900);
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(rand() * w, rand() * h, 1.6, 1.6);
  }
  ctx.restore();
}

/** The title block: big block title, script subtitle, heat meter. */
export function drawTitleBlock(ctx, rect, state, grade) {
  const { title, subtitle, heat } = state;
  const cx = rect.x + rect.w / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const titleSize = Math.min(rect.h * 0.42, rect.w * 0.16);
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y);
  grad.addColorStop(0, grade.sky);
  grad.addColorStop(0.5, grade.accent);
  grad.addColorStop(1, grade.mid);
  ctx.fillStyle = grad;
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.lineWidth = Math.max(2, titleSize * 0.06);
  ctx.lineJoin = 'round';
  const fitted = fitText(ctx, (title || 'NEON COAST').toUpperCase(), cx, rect.y + rect.h * 0.34, rect.w * 0.92, titleSize, (s) => `${s}px Anton, sans-serif`);
  ctx.strokeText((title || 'NEON COAST').toUpperCase(), cx, rect.y + rect.h * 0.34);
  ctx.fillText((title || 'NEON COAST').toUpperCase(), cx, rect.y + rect.h * 0.34);
  void fitted;
  if (subtitle) {
    ctx.fillStyle = grade.title;
    fitText(ctx, subtitle, cx, rect.y + rect.h * 0.66, rect.w * 0.9, Math.round(rect.h * 0.16), (s) => `${s}px Pacifico, cursive`);
  }
  drawHeatMeter(ctx, cx, rect.y + rect.h * 0.86, heat, Math.max(7, rect.h * 0.05), grade.accent);
}

/** Draws the whole cover for a state onto ctx at size w x h. */
export function drawCover(ctx, w, h, state) {
  const grade = GRADES.find((g) => g.id === state.grade) || GRADES[0];
  const panels = layoutPanels(state.layout, w, h);
  const band = titleBand(state.layout, w, h);
  ctx.clearRect(0, 0, w, h);

  // Backdrop: deep sunset gradient so gaps and tilted layouts read as poster art.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, grade.deep);
  bg.addColorStop(0.55, grade.mid);
  bg.addColorStop(1, grade.sky);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Panels: photo (or generated placeholder), then the grade wash.
  for (const panel of panels) {
    ctx.save();
    if (panel.rot) {
      ctx.translate(panel.x + panel.w / 2, panel.y + panel.h / 2);
      ctx.rotate(panel.rot);
      ctx.translate(-panel.w / 2, -panel.h / 2);
    }
    const rect = { x: panel.rot ? 0 : panel.x, y: panel.rot ? 0 : panel.y, w: panel.w, h: panel.h };
    const slot = state.photos[panel.photo] || { img: null, zoom: 1, panX: 0, panY: 0 };
    const painted = slot.img ? drawPhotoInto(ctx, slot.img, rect, slot) : false;
    if (!painted) drawPlaceholder(ctx, rect, 100 + panel.photo * 37);
    // Sunset grade wash over the photo.
    ctx.globalCompositeOperation = 'soft-light';
    const wash = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    wash.addColorStop(0, grade.sky);
    wash.addColorStop(1, grade.deep);
    ctx.fillStyle = wash;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.globalCompositeOperation = 'source-over';
    // Polaroid frame for tilted snapshots.
    if (panel.rot) {
      ctx.fillStyle = '#fdf8ef';
      ctx.fillRect(-Math.round(rect.w * 0.04), -Math.round(rect.h * 0.05), rect.w * 1.08, rect.h * 0.1);
      ctx.fillRect(-Math.round(rect.w * 0.04), rect.h - Math.round(rect.h * 0.02), rect.w * 1.08, rect.h * 0.12);
      ctx.fillRect(-Math.round(rect.w * 0.04), -Math.round(rect.h * 0.05), rect.w * 0.04, rect.h * 1.17);
      ctx.fillRect(rect.w, -Math.round(rect.h * 0.05), rect.w * 0.04, rect.h * 1.17);
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      ctx.strokeRect(-Math.round(rect.w * 0.04), -Math.round(rect.h * 0.05), rect.w * 1.08, rect.h * 1.17);
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(2, w * 0.004);
      ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    }
    ctx.restore();
  }

  // Title: band at the foot, or the middle tile for nine-panel.
  if (band) {
    const bandGrad = ctx.createLinearGradient(0, band.y, 0, band.y + band.h);
    bandGrad.addColorStop(0, grade.ink);
    bandGrad.addColorStop(1, grade.deep);
    ctx.fillStyle = bandGrad;
    ctx.fillRect(band.x, band.y, band.w, band.h);
    ctx.fillStyle = grade.accent;
    ctx.fillRect(band.x, band.y, band.w, Math.max(3, h * 0.006));
    drawHalftone(ctx, band, grade);
    drawTitleBlock(ctx, band, state, grade);
  } else {
    const cw = (w - Math.round(w * 0.012) * 2) / 3;
    const ch = (h - Math.round(w * 0.012) * 2) / 3;
    const tile = { x: Math.round(cw + Math.round(w * 0.012)), y: Math.round(ch + Math.round(w * 0.012)), w: Math.round(cw), h: Math.round(ch) };
    ctx.fillStyle = grade.ink;
    ctx.fillRect(tile.x, tile.y, tile.w, tile.h);
    ctx.strokeStyle = grade.accent;
    ctx.lineWidth = Math.max(2, w * 0.004);
    ctx.strokeRect(tile.x, tile.y, tile.w, tile.h);
    const small = { ...tile, h: tile.h };
    drawTitleBlock(ctx, small, state, grade);
  }

  // Badge ribbon, vignette, grain, poster frame.
  if (state.badge) drawBadge(ctx, state.badge.toUpperCase(), w, grade);
  const vig = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.45, w / 2, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  if (state.grain) drawGrain(ctx, w, h);
  if (state.frame) {
    ctx.strokeStyle = grade.title;
    ctx.lineWidth = Math.max(4, w * 0.008);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
    ctx.strokeStyle = grade.accent;
    ctx.lineWidth = Math.max(2, w * 0.003);
    ctx.strokeRect(ctx.lineWidth * 4, ctx.lineWidth * 4, w - ctx.lineWidth * 8, h - ctx.lineWidth * 8);
  }
}
