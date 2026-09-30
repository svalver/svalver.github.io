// Port of old_applets/netfail/main_netlab.cpp ("Network Editor by @svalver 2018-2026").
import { parseEdgeList, degrees, degreeDistribution } from '../shared/graph.js?v=2e3e9bc0';
import { ForceLayout, NETLAB_LAYOUT, randomPositions } from '../shared/force-layout.js?v=2e3e9bc0';
import { getScale, initScale, onScale } from '../shared/netlab-scale.js?v=2e3e9bc0';
import { NetworkView, Histogram, bindSpeed, bindLayoutParams } from '../shared/netlab-ui.js?v=2e3e9bc0';

const $ = id => document.getElementById(id);
const source = $('source');

// Nodes with degree 0 are drawn dark (col_nodes_off).
const view = new NetworkView($('canvas'), { pad: 8, nodeOff: 'rgb(26,26,51)' });
const pk = new Histogram($('plot'), 'P(k)');
const params = { ...NETLAB_LAYOUT };

function reload() {
  let graph;
  try {
    graph = parseEdgeList(source.value);
  } catch (err) {
    $('error').textContent = err.message;
    return;
  }
  $('error').textContent = '';
  const positions = randomPositions(graph.n);
  const k = degrees(graph);
  view.set(graph, positions, k, new ForceLayout(positions, graph.edges, params));
  $('nodes').textContent = graph.n;
  $('links').textContent = graph.edges.length;
  const p = degreeDistribution(k);
  pk.set(p);
  $('max-degree').textContent = p.length ? p.length - 1 : 0;
}

bindSpeed($('speed'), $('speed-value'), view);
bindLayoutParams(document, params, view);

// --- Splitters (main_netlab.cpp: vsplitter and hsplitter) -------------------
// The view keeps its share of the width; the panels keep their height in
// unscaled pixels, so they grow with the UI scale.

const top = $('top'), viewChild = $('view'), code = document.querySelector('.code');
const content = document.querySelector('.nl-content');
let viewShare = 500 / 776; // 800x600 window: view child 500 px of 776
let panelsHeight = 157;    // 800x600 window: view child 400 px high
const pad = () => 8 * getScale();

function applySplit() {
  const s = getScale(), m = pad();
  const W = content.clientWidth - 2 * m, H = content.clientHeight - 2 * m;
  const viewWidth = Math.max(200 * s, Math.min(W - 200 * s, (W - m) * viewShare));
  const topHeight = Math.max(100 * s, Math.min(H - 100 * s, H - m - panelsHeight * s));
  viewChild.style.width = `${viewWidth}px`;
  code.style.width = `${W - m - viewWidth}px`;
  top.style.height = `${topHeight}px`;
  viewShare = viewWidth / (W - m);
  panelsHeight = (H - m - topHeight) / s;
  view.dirty = true;
}

function splitter(el, onDelta) {
  el.addEventListener('pointerdown', event => {
    el.setPointerCapture(event.pointerId);
    let last = { x: event.clientX, y: event.clientY };
    const move = e => {
      onDelta((e.clientX - last.x) / getScale(), (e.clientY - last.y) / getScale());
      last = { x: e.clientX, y: e.clientY };
      applySplit();
    };
    const up = () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
  });
  el.addEventListener('keydown', event => {
    const step = event.shiftKey ? 64 : 16;
    const d = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[event.key];
    if (!d) return;
    event.preventDefault();
    onDelta(...d);
    applySplit();
  });
}

splitter($('vsplitter'), dx => { viewShare += dx * getScale() / (content.clientWidth - 3 * pad()); });
splitter($('hsplitter'), (dx, dy) => { panelsHeight -= dy; });
new ResizeObserver(applySplit).observe(content);

// --- Start -----------------------------------------------------------------

$('reload').addEventListener('click', reload);
source.addEventListener('keydown', event => {
  if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
    event.preventDefault();
    reload();
  }
});
$('reload').title = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘+Enter' : 'Ctrl+Enter';

initScale($('scale-down'), $('scale-up'));
onScale(() => requestAnimationFrame(applySplit));
reload();
applySplit();
