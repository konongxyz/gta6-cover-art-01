// Fixed scenes for screenshots: ?shot=editor shows the page with samples loaded;
// ?shot=cover shows the cover alone at the requested layout, grade and size.
// window.__shotReady is set once the scene is painted.
import { drawCover, defaultState, SIZES } from './cover.js';

const SAMPLES = ['samples/boulevard.jpg', 'samples/pier.jpg'];

/** Applies the query's layout, grade, size and caption to a fresh state. */
export function sceneState(query) {
  const state = defaultState();
  state.layout = query.get('layout') || 'hero';
  state.grade = query.get('grade') || 'vice';
  state.size = query.get('size') || 'square';
  state.title = query.get('caption') || 'NEON COAST';
  state.subtitle = query.get('subtitle') || 'sunset streets, neon nights';
  state.badge = query.get('badge') || 'EST. 2026';
  state.heat = Number(query.get('heat') || 4);
  return state;
}

/** Loads the two samples into the four slots, alternating them. */
export async function loadSamples(state, load) {
  state.photos[0].img = await load(SAMPLES[0]);
  state.photos[1].img = await load(SAMPLES[1]);
  state.photos[2].img = await load(SAMPLES[0]);
  state.photos[3].img = await load(SAMPLES[1]);
}

export async function runShot(shot, query, state, load) {
  window.__shotActive = true; // keeps main.js from re-entering this scene on import
  const scene = sceneState(query);
  Object.assign(state, scene);
  await loadSamples(state, load);
  // Shift both samples down a touch so faces stay in frame in square panels.
  state.photos.forEach((p) => { p.panY = 0.2; });
  await document.fonts.ready;
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = SIZES.find((s) => s.id === state.size) || SIZES[0];
    const canvas = document.getElementById('preview');
    canvas.width = size.w;
    canvas.height = size.h;
    drawCover(canvas.getContext('2d'), size.w, size.h, state);
  } else {
    // Editor scene: build the full editor, then paint it with samples in.
    const { buildPickers, buildSlots, wireControls, syncControls, redraw } = await import('./main.js');
    buildPickers();
    buildSlots();
    wireControls();
    document.querySelectorAll('#heat .star').forEach((b, i) => {
      b.textContent = '★';
      b.classList.toggle('lit', i < state.heat);
    });
    document.querySelectorAll('.slot-state').forEach((el) => { el.textContent = 'sample loaded'; });
    syncControls();
    redraw();
  }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
