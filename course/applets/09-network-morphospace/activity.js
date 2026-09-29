// Port of old_applets/morphospace/main_map.cpp and models.cpp
// ("Morphospace Viewer by @svalver (2016-2024)").
import { degrees } from '../shared/graph.js?v=ee62343c';
import { ForceLayout, NETLAB_LAYOUT, normalizeCoordinates } from '../shared/force-layout.js?v=ee62343c';
import { initScale, getScale, onScale } from '../shared/netlab-scale.js?v=ee62343c';
import { NetworkView, bindCopy } from '../shared/netlab-ui.js?v=ee62343c';
import { NETWORK_SIZE, erdosRenyi, preferentialAttachment, ringLattice, star, gnc, measures, pajek } from './morphospace.js?v=ee62343c';

const $ = id => document.getElementById(id);
const N = NETWORK_SIZE;
const urand = () => Math.random();
const randomM = () => Math.min(1 + Math.floor(Math.random() * 5), N / 2);
const clip = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// The five models: colour on the map, random parameters for a new point
// (hatch) and the network for given parameters.
const MODELS = {
  ER: { color: 'rgb(0,0,255)', hatch: () => ({ p: urand() }), make: s => erdosRenyi(N, s.p) },
  PA: { color: 'rgb(0,255,0)', hatch: () => ({ m: randomM() }), make: s => preferentialAttachment(N, s.m) },
  Ring: { color: 'rgb(255,255,0)', hatch: () => ({}), make: () => ringLattice(N) },
  Star: { color: 'rgb(0,255,255)', hatch: () => ({}), make: () => star(N) },
  GNC: { color: 'rgb(192,64,64)', hatch: () => ({ m: randomM(), p: urand(), q: urand() }), make: s => gnc(N, s.p, s.q, s.m) },
};

const points = [];     // { name, params, net, positions, degeneracy, determinism, samples }
let selected = null;

const view = new NetworkView($('canvas'), { pad: 0, node: 'rgb(179,179,179)' });
view.speed = 1;        // one layout step per frame, as in the legacy loop

// A new network for point g, measured.
function generate(g) {
  g.net = MODELS[g.name].make(g.params);
  Object.assign(g, measures(g.net));
  g.positions = null;
}

// resetLayout(): ER keeps its nodes on a circle; the other models start near
// the centre and take 10 layout steps.
function startLayout(g) {
  if (!g.positions) {
    if (g.name === 'ER') {
      g.positions = normalizeCoordinates(Array.from({ length: N }, (_, i) => {
        const a = 2 * Math.PI * i / N;
        return { x: N * Math.cos(a), y: N * Math.sin(a) };
      }));
    } else {
      const d = NETLAB_LAYOUT.distance;
      g.positions = Array.from({ length: N }, () => ({
        x: .5 + d * .5 * (2 * Math.random() - 1), y: .5 + d * .5 * (2 * Math.random() - 1),
      }));
    }
  }
  const layout = new ForceLayout(g.positions, g.net.edges, NETLAB_LAYOUT, { bothDirections: !g.net.directed });
  if (g.fresh && g.name !== 'ER') for (let i = 0; i < 10; i++) layout.step();
  g.fresh = false;
  view.set(g.net, g.positions, degrees(g.net), layout);
}

// Sample: a new network with the current parameters, added to the trail of
// samples of this point.
function sample(g) {
  generate(g);
  g.fresh = true;
  g.samples.push({ x: g.degeneracy, y: g.determinism });
  startLayout(g);
  showSelection();
}

function select(g) {
  selected = g;
  if (g) startLayout(g);
  else view.set({ n: 0, edges: [] }, [], [], null);
  showSelection();
}

function hatch(name) {
  const g = { name, params: MODELS[name].hatch(), samples: [], fresh: true };
  generate(g);
  points.push(g);
  select(g);
}

// --- Selection panel -------------------------------------------------------

const inputs = {
  ER: { p: $('er-p') },
  PA: { m: $('pa-m') },
  GNC: { m: $('gnc-m'), p: $('gnc-p'), q: $('gnc-q') },
};

function showSelection() {
  const g = selected;
  $('selected').hidden = !g;
  $('remove').parentElement.hidden = !g;
  $('selected-name').textContent = g
    ? `Selected Network: ${g.name}${g.net.directed ? '' : ' (Undirected)'}`
    : 'No network selected';
  if (g) {
    $('links').textContent = g.net.edges.length;
    $('degeneracy').textContent = g.degeneracy.toFixed(6);
    $('determinism').textContent = g.determinism.toFixed(6);
    $('ei').textContent = g.ei.toFixed(6);
    for (const el of document.querySelectorAll('.params')) el.hidden = el.dataset.model !== g.name;
    for (const [key, input] of Object.entries(inputs[g.name] || {})) {
      input.value = key === 'm' ? g.params.m : g.params[key].toFixed(6);
    }
  }
  drawMap();
}

// Legacy rules: a new p (ER) or m (PA) samples at once and restarts the
// trail; new GNC parameters restart the trail and wait for Sample.
function setParam(key, value) {
  const g = selected;
  if (!g || !Number.isFinite(value)) return showSelection();
  value = key === 'm' ? clip(Math.round(value), 1, N / 2) : clip(value, 0, 1);
  if (value === g.params[key]) return showSelection();
  g.params[key] = value;
  g.samples = [];
  if (g.name === 'GNC') showSelection();
  else sample(g);
}

for (const model of Object.values(inputs)) {
  for (const [key, input] of Object.entries(model)) {
    input.addEventListener('change', () => setParam(key, Number(input.value)));
    const stepper = input.closest('.nl-stepper');
    if (stepper) {
      for (const button of stepper.querySelectorAll('[data-step]')) {
        button.addEventListener('click', () => setParam(key, selected.params[key] + Number(button.dataset.step)));
      }
    }
  }
}

for (const button of document.querySelectorAll('[data-sample]')) {
  button.addEventListener('click', () => {
    const g = selected;
    if (!g) return;
    // Sample (log): force m·q = 1
    if (button.dataset.sample === 'log' && g.params.q !== 1 / g.params.m) {
      g.params.q = 1 / g.params.m;
      g.samples = [];
    }
    sample(g);
  });
}

$('save').addEventListener('click', () => {
  if (!selected) return;
  const url = URL.createObjectURL(new Blob([pajek(selected.net)], { type: 'text/plain' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'sel.net' });
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

$('remove').addEventListener('click', () => {
  points.splice(points.indexOf(selected), 1);
  select(null);
});
$('delete-all').addEventListener('click', () => {
  points.length = 0;
  select(null);
});

for (const button of document.querySelectorAll('[data-hatch]')) {
  button.addEventListener('click', () => {
    for (let i = 0; i < Number(button.dataset.count || 1); i++) hatch(button.dataset.hatch);
  });
}
$('regions').addEventListener('change', drawMap);

// Parameters of a point, as text.
const describe = g => Object.entries(g.params)
  .map(([k, v]) => `${k} = ${k === 'm' ? v : v.toFixed(3)}`).join(', ');

bindCopy($('copy'), () => ({
  header: ['family', 'm', 'p', 'q', 'links', 'degeneracy', 'determinism', 'EI'],
  rows: points.map(g => [g.name, g.params.m ?? '', g.params.p?.toFixed(6) ?? '', g.params.q?.toFixed(6) ?? '',
    g.net.edges.length, g.degeneracy.toFixed(6), g.determinism.toFixed(6), g.ei.toFixed(6)]),
}));

// --- Map -------------------------------------------------------------------

const map = $('map');
const mapCtx = map.getContext('2d');
const MAX_VALUE = Math.log2(N);   // both axes run from 0 to log2(N)

// The plot area leaves room for the tick values on the left and bottom and
// for points near the top and right edges.
function mapFrame() {
  const w = map.clientWidth, h = map.clientHeight, s = getScale();
  const left = 20 * s, right = 20 * s, top = 22 * s, bottom = 34 * s;
  const size = { x: w - left - right, y: h - top - bottom };
  const origin = { x: left, y: top + size.y };
  return { w, h, s, size, origin, at: (x, y) => ({ x: origin.x + size.x * x / MAX_VALUE, y: origin.y - size.y * y / MAX_VALUE }) };
}

// Convex hull (monotone chain) of [x, y] points.
function hull(pts) {
  pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = list => {
    const out = [];
    for (const p of list) {
      while (out.length > 1 && cross(out.at(-2), out.at(-1), p) <= 0) out.pop();
      out.push(p);
    }
    out.pop();
    return out;
  };
  return [...half(pts), ...half(pts.slice().reverse())];
}

const alpha = (rgb, a) => rgb.replace('rgb(', 'rgba(').replace(')', `,${a})`);

function drawMap() {
  const dpr = window.devicePixelRatio || 1;
  const { w, h, s, size, origin, at } = mapFrame();
  if (!w || !h) return;
  if (map.width !== Math.round(w * dpr) || map.height !== Math.round(h * dpr)) {
    map.width = Math.round(w * dpr);
    map.height = Math.round(h * dpr);
  }
  const ctx = mapCtx;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  ctx.lineWidth = 1;
  ctx.font = `${16 * s}px ProggyClean, monospace`;
  const line = (a, b, color) => {
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
  };

  // The forbidden region below the diagonal (EI < 0)
  const o = { x: origin.x + .5, y: origin.y - .5 };
  const corner = { x: o.x + size.x, y: o.y }, top = { x: o.x + size.x, y: o.y - size.y };
  ctx.fillStyle = 'rgba(64,64,128,.22)';
  ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(corner.x, corner.y); ctx.lineTo(top.x, top.y); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(150,150,215,.8)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('Forbidden region (EI < 0)', corner.x - 8 * s, corner.y - 8 * s);

  // Regions covered by each family
  if ($('regions').checked) {
    for (const name of Object.keys(MODELS)) {
      const pts = points.filter(g => g.name === name).flatMap(g =>
        [[g.degeneracy, g.determinism], ...g.samples.map(p => [p.x, p.y])]);
      const shape = hull(pts);
      if (shape.length < 2) continue;
      const color = MODELS[name].color;
      ctx.beginPath();
      shape.forEach(([x, y], i) => { const q = at(x, y); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
      ctx.closePath();
      ctx.fillStyle = alpha(color, .12);
      ctx.fill();
      ctx.strokeStyle = alpha(color, .5);
      ctx.stroke();
    }
  }

  // Axes, ticks and labels
  line(o, corner, 'rgb(255,255,255)');
  line(o, { x: o.x, y: o.y - size.y }, 'rgb(255,255,255)');
  line(o, top, 'rgb(64,64,128)');   // the diagonal: EI = 0
  ctx.fillStyle = 'rgb(255,255,255)';
  for (let v = 0; v <= 5; v++) {
    const q = at(v, v);
    line({ x: q.x + .5, y: o.y }, { x: q.x + .5, y: o.y + 4 * s }, 'rgb(255,255,255)');
    line({ x: o.x, y: q.y - .5 }, { x: o.x - 4 * s, y: q.y - .5 }, 'rgb(255,255,255)');
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(String(v), q.x, o.y + 5 * s);
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    ctx.fillText(String(v), o.x - 6 * s, q.y);
  }
  ctx.textBaseline = 'top';
  ctx.textAlign = 'right';
  ctx.fillText('Degeneracy', corner.x, o.y + 18 * s);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Determinism', o.x + 4 * s, o.y - size.y - 4 * s);

  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  for (const g of points) {
    const color = MODELS[g.name].color;
    // the trail of samples
    ctx.strokeStyle = color;
    ctx.beginPath();
    g.samples.forEach((p, i) => { const q = at(p.x, p.y); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
    ctx.stroke();
    const q = at(g.degeneracy, g.determinism);
    ctx.fillStyle = g === selected ? 'rgb(255,255,255)' : color;
    ctx.beginPath(); ctx.arc(q.x, q.y, 6 * s, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = 'rgb(255,255,255)';
    ctx.fillText(g.name, q.x + 10 * s, q.y - 10 * s);
  }
}

// The point within 8 px of a pointer event (the last one drawn, on top).
function pointAt(event) {
  const rect = map.getBoundingClientRect();
  const x = event.clientX - rect.left, y = event.clientY - rect.top;
  const { s, at } = mapFrame();
  for (let i = points.length - 1; i >= 0; i--) {
    const q = at(points[i].degeneracy, points[i].determinism);
    if ((q.x - x) ** 2 + (q.y - y) ** 2 < (8 * s) ** 2) return points[i];
  }
  return null;
}

map.addEventListener('pointerdown', event => { const g = pointAt(event); if (g) select(g); });

// Hovering a point: its model, parameters and values.
const tip = Object.assign(document.createElement('div'), { className: 'nl-tooltip', hidden: true });
document.body.append(tip);
map.addEventListener('pointermove', event => {
  const g = pointAt(event);
  map.style.cursor = g ? 'pointer' : '';
  if (!g) { tip.hidden = true; return; }
  const params = describe(g);
  tip.textContent = `${g.name}${params ? `: ${params}` : ''}; degeneracy = ${g.degeneracy.toFixed(3)}, ` +
    `determinism = ${g.determinism.toFixed(3)}, EI = ${g.ei.toFixed(3)}`;
  tip.style.left = `${event.clientX + 16}px`;
  tip.style.top = `${event.clientY + 8}px`;
  tip.hidden = false;
});
map.addEventListener('pointerleave', () => { tip.hidden = true; map.style.cursor = ''; });

new ResizeObserver(drawMap).observe(map);
initScale($('scale-down'), $('scale-up'));
onScale(() => { view.dirty = true; drawMap(); });
$('nodes').textContent = N;
showSelection();
