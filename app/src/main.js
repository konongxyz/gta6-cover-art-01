// Neon Coast Cover Studio's editor: wires the controls to the cover engine.
// Photos are read with object URLs on this machine only and are never sent
// anywhere; the two sample scenes are painted by samples.js.

import { GRADES, LAYOUTS, SIZES, panelRects, renderCover, sizeOf, tiltedFrames } from './cover.js';
import { paintNeonScene, paintSunsetScene } from './samples.js';

const $ = (id) => document.getElementById(id);

const state = {
  size: 'wide',
  layout: 'hero',
  grade: 'vice',
  title: 'NEON COAST',
  subtitle: 'one night in the city',
  badge: 'NEW POSTER',
  heat: 4,
  sources: [null, null, null, null, null, null],
  panels: [],
  selected: 0,
};

// Nine panel slots, each remembering its photo source and framing; layouts
// use as many as they have panels. Defaults alternate the sample scenes so a
// fresh studio already shows a cover.
const defaultSources = [4, 5, 4, 5, 4, 5, 4, 5, 4];
for (let i = 0; i < 9; i++) {
  state.panels.push({ source: defaultSources[i], zoom: 1, panX: 0, panY: 0 });
}

state.sources[4] = paintSunsetScene();
state.sources[5] = paintNeonScene();

const canvas = $('cover');
const status = $('status');

function setStatus(message) {
  status.textContent = message;
}

function currentPanelCount() {
  if (state.layout === 'tilted') return 3;
  return panelRects(state.layout, 100, 100).length;
}

function buildChips() {
  const layoutBox = $('layouts');
  for (const layout of LAYOUTS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = layout.name;
    b.dataset.layout = layout.id;
    b.setAttribute('aria-pressed', String(state.layout === layout.id));
    b.addEventListener('click', () => {
      state.layout = layout.id;
      state.selected = 0;
      syncChips();
      syncPanelControls();
      draw();
    });
    layoutBox.appendChild(b);
  }
  const gradeBox = $('grades');
  for (const grade of GRADES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.grade = grade.id;
    b.setAttribute('aria-pressed', String(state.grade === grade.id));
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = grade.swatch;
    b.appendChild(sw);
    b.appendChild(document.createTextNode(grade.name));
    b.addEventListener('click', () => {
      state.grade = grade.id;
      syncChips();
      draw();
    });
    gradeBox.appendChild(b);
  }
}

function syncChips() {
  for (const b of $('layouts').children) b.setAttribute('aria-pressed', String(b.dataset.layout === state.layout));
  for (const b of $('grades').children) b.setAttribute('aria-pressed', String(b.dataset.grade === state.grade));
}

function slotState(slot, text) {
  $(`state${slot}`).textContent = text;
}

function loadPhoto(slot, file) {
  if (!file) return;
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    state.sources[slot] = img;
    slotState(slot, file.name);
    setStatus(`Photo ${slot + 1} loaded — it never leaves this machine.`);
    draw();
  };
  img.onerror = () => setStatus(`That file could not be read as an image.`);
  img.src = url;
}

function wireSlots() {
  for (let slot = 0; slot < 4; slot++) {
    $(`photo${slot}`).addEventListener('change', (e) => loadPhoto(slot, e.target.files[0]));
  }
  for (const b of document.querySelectorAll('[data-sample]')) {
    b.addEventListener('click', () => {
      const slot = Number(b.dataset.sample);
      state.sources[slot] = b.dataset.scene === 'sunset' ? state.sources[4] : state.sources[5];
      slotState(slot, b.dataset.scene === 'sunset' ? 'Sunset sample scene' : 'Neon sample scene');
      draw();
    });
  }
}

function syncPanelControls() {
  const panel = state.panels[state.selected];
  $('panelLabel').textContent = `${state.selected + 1} of ${currentPanelCount()}`;
  $('panelSource').value = String(panel.source);
  $('zoom').value = String(panel.zoom);
  $('panX').value = String(panel.panX);
  $('panY').value = String(panel.panY);
}

function wirePanelControls() {
  $('panelSource').addEventListener('change', (e) => {
    state.panels[state.selected].source = Number(e.target.value);
    draw();
  });
  $('zoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value);
    draw();
  });
  $('panX').addEventListener('input', (e) => {
    state.panels[state.selected].panX = Number(e.target.value);
    draw();
  });
  $('panY').addEventListener('input', (e) => {
    state.panels[state.selected].panY = Number(e.target.value);
    draw();
  });
}

function wireTextControls() {
  $('title').addEventListener('input', (e) => { state.title = e.target.value; draw(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; draw(); });
  $('badge').addEventListener('input', (e) => { state.badge = e.target.value; draw(); });
  $('heat').addEventListener('input', (e) => {
    state.heat = Number(e.target.value);
    $('heatValue').textContent = `${state.heat} / 5`;
    draw();
  });
  $('size').addEventListener('change', (e) => { state.size = e.target.value; draw(); });
}

// Draw the cover, then (in the editor only) outline the selected panel.
function draw() {
  renderCover(canvas, state);
  const ctx = canvas.getContext('2d');
  const { w: W, h: H } = sizeOf(state.size);
  ctx.save();
  ctx.strokeStyle = '#ffd23f';
  ctx.lineWidth = Math.max(3, Math.min(W, H) * 0.006);
  ctx.setLineDash([Math.min(W, H) * 0.03, Math.min(W, H) * 0.02]);
  if (state.layout === 'tilted') {
    const f = tiltedFrames(W, H)[state.selected];
    if (f) {
      ctx.translate(f.cx, f.cy);
      ctx.rotate(f.rot);
      ctx.strokeRect(-f.w / 2, -f.h / 2, f.w, f.h * 1.16);
    }
  } else {
    const rect = panelRects(state.layout, W, H)[state.selected];
    if (rect) ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  }
  ctx.restore();
}

function wireCanvasPick() {
  canvas.addEventListener('click', (e) => {
    const box = canvas.getBoundingClientRect();
    const { w: W, h: H } = sizeOf(state.size);
    const x = ((e.clientX - box.left) / box.width) * W;
    const y = ((e.clientY - box.top) / box.height) * H;
    if (state.layout === 'tilted') {
      const frames = tiltedFrames(W, H);
      for (let i = frames.length - 1; i >= 0; i--) {
        const f = frames[i];
        if (Math.abs(x - f.cx) <= f.w / 2 && Math.abs(y - f.cy) <= f.h * 0.58) {
          state.selected = i;
          break;
        }
      }
    } else {
      const rects = panelRects(state.layout, W, H);
      const hit = rects.findIndex((r) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h);
      if (hit >= 0 && !(state.layout === 'nine' && hit === 4)) state.selected = hit;
    }
    syncPanelControls();
    draw();
  });
}

function wireExport() {
  $('export').addEventListener('click', () => {
    renderCover(canvas, state);
    const { w: W, h: H } = sizeOf(state.size);
    canvas.toBlob((blob) => {
      if (!blob) {
        setStatus('Export failed in this browser.');
        draw();
        return;
      }
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `neon-coast-cover-${W}x${H}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      setStatus(`Exported a ${W} × ${H} PNG.`);
      draw();
    }, 'image/png');
  });
}

buildChips();
wireSlots();
wirePanelControls();
wireTextControls();
wireCanvasPick();
wireExport();
syncPanelControls();
slotState(0, 'empty — or use a sample');
setStatus('Pick a layout, add photos, export. The samples are already loaded.');

// Lettering needs the vendored fonts; draw once now and again when they land.
draw();
if (document.fonts?.load) {
  Promise.all([
    document.fonts.load('80px Anton'),
    document.fonts.load('40px Pacifico'),
  ]).then(() => draw()).catch(() => {});
}
