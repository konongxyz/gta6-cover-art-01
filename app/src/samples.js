// Built-in sample scenes, painted by code so the studio works before a photo is
// loaded and so the screenshots need no one's real photo. Each painter draws a
// sunset-or-neon coastal scene into an offscreen canvas at 1000 x 1250.

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

// One palm tree silhouette: a curved trunk and a crown of fronds, rooted at (x, y)
// with the crown `height` above it, leaning `lean` pixels to the side.
function drawPalm(ctx, x, y, height, lean, colour) {
  ctx.strokeStyle = colour;
  ctx.fillStyle = colour;
  ctx.lineCap = 'round';
  const topX = x + lean;
  const topY = y - height;
  ctx.lineWidth = Math.max(6, height * 0.035);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + lean * 0.3, y - height * 0.6, topX, topY);
  ctx.stroke();
  ctx.lineWidth = Math.max(3, height * 0.016);
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * (0.08 + (i / 7) * 0.84);
    const len = height * (0.34 + 0.1 * Math.sin(i * 2.3));
    const ex = topX + Math.cos(a) * len * (i < 4 ? -1 : 1) * 0.9 + Math.cos(a) * len * 0.2;
    const ey = topY - Math.sin(a) * len * 0.42 + len * 0.22;
    ctx.beginPath();
    ctx.moveTo(topX, topY);
    ctx.quadraticCurveTo(topX + (ex - topX) * 0.5, topY - len * 0.28, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(topX, topY + height * 0.02, height * 0.028, 0, Math.PI * 2);
  ctx.arc(topX + height * 0.045, topY + height * 0.035, height * 0.022, 0, Math.PI * 2);
  ctx.fill();
}

// Sunset boulevard: a banded sunset sky, a low sun, a skyline, palm silhouettes
// and a road running out of the bottom of the frame.
export function paintSunsetScene() {
  const w = 1000;
  const h = 1250;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const sky = ctx.createLinearGradient(0, 0, 0, h * 0.78);
  sky.addColorStop(0, '#2a0a4e');
  sky.addColorStop(0.34, '#8e1e63');
  sky.addColorStop(0.58, '#e8483f');
  sky.addColorStop(0.8, '#ff7e29');
  sky.addColorStop(1, '#ffd23f');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h * 0.8);
  // Retro sun bands across the disc.
  const sun = ctx.createRadialGradient(w * 0.5, h * 0.62, 10, w * 0.5, h * 0.62, w * 0.34);
  sun.addColorStop(0, 'rgba(255,236,170,0.95)');
  sun.addColorStop(0.7, 'rgba(255,170,60,0.85)');
  sun.addColorStop(1, 'rgba(255,120,40,0)');
  ctx.fillStyle = sun;
  ctx.fillRect(0, 0, w, h * 0.85);
  ctx.fillStyle = '#ffdf8e';
  ctx.beginPath();
  ctx.arc(w * 0.5, h * 0.62, w * 0.21, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(180,30,80,0.5)';
  for (let i = 0; i < 4; i++) ctx.fillRect(0, h * (0.6 + i * 0.045), w, h * 0.012);
  // Skyline silhouette.
  ctx.fillStyle = '#2a0a35';
  const base = h * 0.78;
  const towers = [[0, 150, 90], [95, 210, 70], [170, 120, 110], [285, 240, 80], [370, 160, 95], [470, 200, 75], [550, 130, 105], [660, 225, 85], [750, 150, 90], [845, 195, 80], [930, 140, 70]];
  for (const [x, th, tw] of towers) ctx.fillRect(x, base - th, tw, th);
  ctx.fillStyle = '#ffd76a';
  for (let i = 0; i < 46; i++) {
    const tx = (i * 173) % w;
    const ty = base - 20 - ((i * 97) % 190);
    if ((i * 31) % 5 !== 0) ctx.fillRect(tx, ty, 5, 7);
  }
  // Sea band, then the road.
  ctx.fillStyle = '#7a1e52';
  ctx.fillRect(0, base, w, h * 0.05);
  ctx.fillStyle = '#ffd23f';
  ctx.fillRect(0, base, w, 4);
  ctx.fillStyle = '#160a24';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(w * 0.36, h * 0.83);
  ctx.lineTo(w * 0.64, h * 0.83);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#0d0518';
  ctx.fillRect(0, h * 0.83, w, h * 0.17);
  ctx.fillStyle = 'rgba(255,210,63,0.85)';
  for (let i = 0; i < 4; i++) {
    const t = i / 4;
    const rw = 4 + t * 16;
    ctx.fillRect(w * 0.5 - rw / 2, h * (0.85 + t * 0.13), rw, h * 0.028);
  }
  drawPalm(ctx, w * 0.1, h * 0.86, h * 0.42, 60, '#160a24');
  drawPalm(ctx, w * 0.93, h * 0.88, h * 0.5, -70, '#160a24');
  drawPalm(ctx, w * 0.82, h * 0.84, h * 0.3, -30, '#1f0d30');
  return c;
}

// Neon alley: night buildings, glowing sign boards in pink and teal, and a wet
// street throwing the glow back.
export function paintNeonScene() {
  const w = 1000;
  const h = 1250;
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#050914');
  bg.addColorStop(0.6, '#0a1230');
  bg.addColorStop(1, '#131a3d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  // Stars and a moon sliver.
  ctx.fillStyle = 'rgba(220,235,255,0.8)';
  for (let i = 0; i < 60; i++) ctx.fillRect((i * 211) % w, (i * 89) % (h * 0.4), 2, 2);
  ctx.fillStyle = '#e8f2ff';
  ctx.beginPath();
  ctx.arc(w * 0.82, h * 0.1, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#050914';
  ctx.beginPath();
  ctx.arc(w * 0.85, h * 0.09, 30, 0, Math.PI * 2);
  ctx.fill();
  // Buildings.
  ctx.fillStyle = '#0a0f22';
  const blocks = [[0, 0.18, 0.24], [0.22, 0.3, 0.2], [0.4, 0.12, 0.26], [0.64, 0.26, 0.18], [0.8, 0.16, 0.2]];
  for (const [fx, fh, fw] of blocks) ctx.fillRect(w * fx, h * (0.72 - fh), w * fw, h * fh + 4);
  ctx.fillStyle = 'rgba(255,214,120,0.75)';
  for (let i = 0; i < 70; i++) {
    const bx = (i * 137) % w;
    const by = h * 0.34 + ((i * 61) % (h * 0.34));
    if ((i * 17) % 4 !== 0) ctx.fillRect(bx, by, 7, 10);
  }
  // Neon sign boards with a glow.
  const signs = [
    [0.06, 0.3, 0.2, 0.1, '#ff4e8a'],
    [0.34, 0.22, 0.26, 0.12, '#22d3ee'],
    [0.68, 0.32, 0.22, 0.1, '#ff7e29'],
    [0.12, 0.52, 0.3, 0.09, '#a78bfa'],
    [0.58, 0.5, 0.3, 0.09, '#34f5c5'],
  ];
  for (const [fx, fy, fw, fh, colour] of signs) {
    ctx.save();
    ctx.shadowColor = colour;
    ctx.shadowBlur = 42;
    ctx.strokeStyle = colour;
    ctx.lineWidth = 6;
    ctx.strokeRect(w * fx, h * fy, w * fw, h * fh);
    ctx.fillStyle = colour;
    ctx.globalAlpha = 0.16;
    ctx.fillRect(w * fx, h * fy, w * fw, h * fh);
    ctx.globalAlpha = 0.9;
    ctx.fillRect(w * (fx + 0.02), h * (fy + fh * 0.38), w * (fw - 0.04), 5);
    ctx.restore();
  }
  // Wet street with reflected glow.
  const street = ctx.createLinearGradient(0, h * 0.72, 0, h);
  street.addColorStop(0, '#0a1030');
  street.addColorStop(1, '#05070f');
  ctx.fillStyle = street;
  ctx.fillRect(0, h * 0.72, w, h * 0.28);
  for (const [fx, , fw, , colour] of signs) {
    const grad = ctx.createLinearGradient(0, h * 0.72, 0, h);
    grad.addColorStop(0, colour);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = grad;
    ctx.fillRect(w * fx, h * 0.72, w * fw, h * 0.28);
    ctx.restore();
  }
  ctx.fillStyle = 'rgba(200,225,255,0.5)';
  for (let i = 0; i < 130; i++) ctx.fillRect((i * 167) % w, h * 0.74 + ((i * 53) % (h * 0.22)), 14, 2);
  return c;
}
