// Neon Coast Cover Studio — wires the editor: photo slots, layouts, grades,
// lettering, crop controls, undo/redo and one-click PNG export.
// A `?shot=` query sets up a fixed scene for a screenshot instead (./shots.js).
import { drawCover, defaultState, layoutPanels, titleBand, LAYOUTS, GRADES, SIZES } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const preview = $('preview');
const pctx = preview.getContext('2d');
const status = $('status');
const state = defaultState();
let selectedPanel = 0;
let undoStack = [];
let redoStack = [];

/** Loads an image from a URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/** The preview canvas size follows the chosen export size's aspect. */
export function sizePreview() {
  const size = SIZES.find((s) => s.id === state.size) || SIZES[0];
  const max = 640;
  const scale = Math.min(max / size.w, max / size.h);
  preview.width = Math.round(size.w * scale);
  preview.height = Math.round(size.h * scale);
  preview.style.aspectRatio = `${size.w} / ${size.h}`;
}

/** Paints the live preview from the current state. */
export function redraw() {
  sizePreview();
  const off = document.createElement('canvas');
  off.width = preview.width;
  off.height = preview.height;
  drawCover(off.getContext('2d'), off.width, off.height, state);
  pctx.clearRect(0, 0, preview.width, preview.height);
  pctx.drawImage(off, 0, 0);
  highlightSelected();
}

/** Outlines the selected panel on the preview so crop controls target it. */
export function highlightSelected() {
  const panels = layoutPanels(state.layout, preview.width, preview.height);
  const panel = panels[selectedPanel] || panels[0];
  if (!panel) return;
  pctx.save();
  pctx.strokeStyle = '#ffd166';
  pctx.lineWidth = 3;
  pctx.setLineDash([10, 6]);
  pctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
  pctx.restore();
}

/** Pushes a snapshot for undo before a change. */
export function pushUndo() {
  undoStack.push(JSON.stringify(snapshotState()));
  if (undoStack.length > 40) undoStack.shift();
  redoStack = [];
  updateUndoButtons();
}

/** The state minus the images, so it can be snapshotted and restored. */
export function snapshotState() {
  return {
    layout: state.layout,
    grade: state.grade,
    size: state.size,
    title: state.title,
    subtitle: state.subtitle,
    badge: state.badge,
    heat: state.heat,
    grain: state.grain,
    frame: state.frame,
    photos: state.photos.map((p) => ({ zoom: p.zoom, panX: p.panX, panY: p.panY })),
  };
}

/** Restores a snapshot (images stay where they are). */
export function restoreSnapshot(snap) {
  Object.assign(state, {
    layout: snap.layout,
    grade: snap.grade,
    size: snap.size,
    title: snap.title,
    subtitle: snap.subtitle,
    badge: snap.badge,
    heat: snap.heat,
    grain: snap.grain,
    frame: snap.frame,
  });
  snap.photos.forEach((p, i) => {
    state.photos[i].zoom = p.zoom;
    state.photos[i].panX = p.panX;
    state.photos[i].panY = p.panY;
  });
  syncControls();
  redraw();
}

export function updateUndoButtons() {
  $('undo').disabled = undoStack.length === 0;
  $('redo').disabled = redoStack.length === 0;
}

/** Rebuilds the layout buttons, grade swatches and size options. */
export function buildPickers() {
  const layoutBox = $('layouts');
  LAYOUTS.forEach((l) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'pick';
    b.textContent = l.name;
    b.dataset.layout = l.id;
    b.addEventListener('click', () => {
      pushUndo();
      state.layout = l.id;
      selectedPanel = 0;
      syncControls();
      redraw();
    });
    layoutBox.appendChild(b);
  });
  const gradeBox = $('grades');
  GRADES.forEach((g) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'swatch';
    b.dataset.grade = g.id;
    b.title = g.name;
    b.style.background = `linear-gradient(135deg, ${g.sky} 0%, ${g.mid} 55%, ${g.deep} 100%)`;
    b.addEventListener('click', () => {
      pushUndo();
      state.grade = g.id;
      syncControls();
      redraw();
    });
    gradeBox.appendChild(b);
  });
  const sizeBox = $('size');
  SIZES.forEach((s) => {
    const o = document.createElement('option');
    o.value = s.id;
    o.textContent = s.name;
    sizeBox.appendChild(o);
  });
}

/** Builds the four photo slots: file input, sample button, zoom and pan. */
export function buildSlots() {
  const box = $('slots');
  state.photos.forEach((slot, i) => {
    const div = document.createElement('div');
    div.className = 'slot';
    div.innerHTML = `<span class="slot-name">Photo ${i + 1}</span>
      <label class="file-btn">Choose photo<input type="file" accept="image/*" hidden></label>
      <button type="button" class="sample-btn">Use sample ${i % 2 === 0 ? 'boulevard' : 'pier'}</button>
      <span class="slot-state">empty</span>`;
    const fileInput = div.querySelector('input[type=file]');
    fileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      pushUndo();
      state.photos[i].img = await loadImage(URL.createObjectURL(file));
      div.querySelector('.slot-state').textContent = file.name.slice(0, 18);
      redraw();
    });
    div.querySelector('.sample-btn').addEventListener('click', async () => {
      pushUndo();
      state.photos[i].img = await loadImage(`samples/${i % 2 === 0 ? 'boulevard' : 'pier'}.jpg`);
      div.querySelector('.slot-state').textContent = 'sample loaded';
      redraw();
    });
    box.appendChild(div);
  });
}

/** Marks the active layout, grade and size in the controls. */
export function syncControls() {
  document.querySelectorAll('#layouts .pick').forEach((b) => b.classList.toggle('active', b.dataset.layout === state.layout));
  document.querySelectorAll('#grades .swatch').forEach((b) => b.classList.toggle('active', b.dataset.grade === state.grade));
  $('size').value = state.size;
  $('title').value = state.title;
  $('subtitle').value = state.subtitle;
  $('badge').value = state.badge;
  $('grain').checked = state.grain;
  $('frame').checked = state.frame;
  document.querySelectorAll('#heat .star').forEach((b, i) => b.classList.toggle('lit', i < state.heat));
  const panels = layoutPanels(state.layout, preview.width || 640, preview.height || 640);
  const panel = panels[selectedPanel] || panels[0];
  const slot = state.photos[panel ? panel.photo : 0];
  $('zoom').value = slot.zoom;
  $('panx').value = slot.panX;
  $('pany').value = slot.panY;
  $('crop-label').textContent = `Crop panel ${selectedPanel + 1} (photo ${panel ? panel.photo + 1 : 1})`;
}

/** Exports the cover at a chosen size as a PNG download. */
export function exportCover(sizeId) {
  const size = SIZES.find((s) => s.id === sizeId) || SIZES[0];
  const off = document.createElement('canvas');
  off.width = size.w;
  off.height = size.h;
  drawCover(off.getContext('2d'), size.w, size.h, state);
  off.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-${size.w}x${size.h}.png`;
    a.click();
    status.textContent = `Saved neon-coast-${size.w}x${size.h}.png`;
  }, 'image/png');
}

/** Clicking the preview selects the panel under the cursor. */
export function wirePreviewClick() {
  preview.addEventListener('click', (e) => {
    const r = preview.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * preview.width;
    const y = ((e.clientY - r.top) / r.height) * preview.height;
    const panels = layoutPanels(state.layout, preview.width, preview.height);
    const idx = panels.findIndex((p) => x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h);
    if (idx >= 0) {
      selectedPanel = idx;
      syncControls();
      redraw();
    }
  });
}

/** Wires every control on the page. */
export function wireControls() {
  $('title').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  $('subtitle').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  $('badge').addEventListener('input', (e) => { state.badge = e.target.value; redraw(); });
  $('size').addEventListener('change', (e) => { pushUndo(); state.size = e.target.value; syncControls(); redraw(); });
  $('grain').addEventListener('change', (e) => { pushUndo(); state.grain = e.target.checked; redraw(); });
  $('frame').addEventListener('change', (e) => { pushUndo(); state.frame = e.target.checked; redraw(); });
  document.querySelectorAll('#heat .star').forEach((b, i) => {
    b.addEventListener('click', () => { pushUndo(); state.heat = i + 1; syncControls(); redraw(); });
  });
  const crop = () => {
    const panels = layoutPanels(state.layout, preview.width, preview.height);
    const panel = panels[selectedPanel] || panels[0];
    const slot = state.photos[panel.photo];
    slot.zoom = Number($('zoom').value);
    slot.panX = Number($('panx').value);
    slot.panY = Number($('pany').value);
    redraw();
  };
  $('zoom').addEventListener('input', crop);
  $('panx').addEventListener('input', crop);
  $('pany').addEventListener('input', crop);
  $('undo').addEventListener('click', () => {
    if (!undoStack.length) return;
    redoStack.push(JSON.stringify(snapshotState()));
    restoreSnapshot(JSON.parse(undoStack.pop()));
    updateUndoButtons();
  });
  $('redo').addEventListener('click', () => {
    if (!redoStack.length) return;
    undoStack.push(JSON.stringify(snapshotState()));
    restoreSnapshot(JSON.parse(redoStack.pop()));
    updateUndoButtons();
  });
  document.querySelectorAll('[data-export]').forEach((b) => {
    b.addEventListener('click', () => exportCover(b.dataset.export));
  });
  $('fill-samples').addEventListener('click', async () => {
    pushUndo();
    state.photos[0].img = await loadImage('samples/boulevard.jpg');
    state.photos[1].img = await loadImage('samples/pier.jpg');
    state.photos[2].img = await loadImage('samples/boulevard.jpg');
    state.photos[3].img = await loadImage('samples/pier.jpg');
    document.querySelectorAll('.slot-state').forEach((el) => { el.textContent = 'sample loaded'; });
    redraw();
    status.textContent = 'Samples loaded — pick a layout and export.';
  });
  wirePreviewClick();
}

const shot = new URLSearchParams(location.search).get('shot');
if (shot && !window.__shotActive) {
  // Screenshot scene: the shot module loads samples and sets the state.
  runShot(shot, new URLSearchParams(location.search), state, async (sample) => loadImage(sample));
} else if (!shot) {
  buildPickers();
  buildSlots();
  wireControls();
  document.querySelectorAll('#heat .star').forEach((b, i) => {
    b.textContent = '★';
    b.classList.toggle('lit', i < state.heat);
  });
  document.fonts.ready.then(() => redraw());
  syncControls();
  redraw();
}
