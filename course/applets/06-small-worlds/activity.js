// Port of old_applets/netfail/main_exp4.cpp ("Small World - by @svalver 2016-2026").
import { lattice, degrees, distancesFrom, distanceStats } from '../shared/graph.js?v=ee62343c';
import { ForceLayout, normalizeCoordinates } from '../shared/force-layout.js?v=ee62343c';
import { initScale, onScale } from '../shared/netlab-scale.js?v=ee62343c';
import { NetworkView, Histogram, bindSpeed, bindLayoutParams, bindCopy } from '../shared/netlab-ui.js?v=ee62343c';

const $ = id => document.getElementById(id);
const SIDE = 16; // create_lattice(16, 16)

// Layout defaults of main_exp4.cpp.
const params = { distance: .04, theta: 1, charge: -.002, strength: .9, gravity: .3, friction: .2 };

// Clicks pick endpoints, so nodes are not dragged here.
const view = new NetworkView($('canvas'), { pad: 0, draggable: false });
const aplPlot = new Histogram($('apl-plot'), '<D>');

let graph, k, source, shortcuts, history, fromSource;
// The solution, step by step, so it can be sent to the class board and
// replayed exactly: each shortcut with the grid link it replaced, and failures.
let events;

const key = (a, b) => a < b ? `${a}:${b}` : `${b}:${a}`;
const isShortcut = ({ source: a, target: b }) => shortcuts.has(key(a, b));

// Average path length over all pairs, or Infinity if the network is
// disconnected (fGetDistance returns WINF then).
function averagePathLength() {
  const { meanDistance } = distanceStats(graph);
  const { dist } = distancesFrom(graph, 0);
  return dist.every(Number.isFinite) ? meanDistance : Infinity;
}

// Quadrants of the lattice (Q11): faint lines through the middle of the grid,
// drawn from the grid coordinates so they stay put until the layout moves.
view.overlay = (ctx, s) => {
  const p = i => view.toScreen(view.positions[i]);
  const mid = (a, b) => ({ x: (p(a).x + p(b).x) / 2, y: (p(a).y + p(b).y) / 2 });
  const h = SIDE / 2;
  const top = mid(h - 1, h), bottom = mid(SIDE * (SIDE - 1) + h - 1, SIDE * (SIDE - 1) + h);
  const left = mid((h - 1) * SIDE, h * SIDE), right = mid((h - 1) * SIDE + SIDE - 1, h * SIDE + SIDE - 1);
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = s;
  ctx.setLineDash([4 * s, 4 * s]);
  ctx.beginPath();
  ctx.moveTo(top.x, top.y - 8 * s); ctx.lineTo(bottom.x, bottom.y + 8 * s);
  ctx.moveTo(left.x - 8 * s, left.y); ctx.lineTo(right.x + 8 * s, right.y);
  ctx.stroke();
  ctx.restore();
};

// Distance rings from the source while choosing the target, as in 05.
const RING = [[255, 255, 160], [255, 170, 60], [230, 80, 110], [140, 80, 210], [70, 80, 170]];
function ringColor(d, max) {
  const t = Math.min(1, d / Math.max(1, max)) * (RING.length - 1);
  const i = Math.min(RING.length - 2, Math.floor(t)), f = t - i;
  return `rgb(${RING[i].map((v, j) => Math.round(v + (RING[i + 1][j] - v) * f))})`;
}

function relayout() {
  const layout = new ForceLayout(view.positions, graph.edges, params);
  view.set(graph, view.positions, degrees(graph), layout);
}

function refresh() {
  k = degrees(graph);
  view.degrees = k;
  fromSource = source >= 0 ? distancesFrom(graph, source).dist : null;
  const far = fromSource ? Math.max(0, ...fromSource.filter(Number.isFinite)) : 0;
  view.nodeColor = fromSource
    ? i => (i === source || !Number.isFinite(fromSource[i]) ? null : ringColor(fromSource[i], far))
    : null;
  view.nodeInfo = fromSource ? i => `d = ${Number.isFinite(fromSource[i]) ? fromSource[i] : 'inf'}` : null;
  view.highlight = {
    nodes: source >= 0 ? [source] : [],
    strong: graph.edges.filter(isShortcut).map(({ source: a, target: b }) => [a - 1, b - 1]),
  };
  $('instruction').textContent = source >= 0
    ? 'Left-click to select the target endpoint.'
    : 'Left-click to select the source endpoint.';
  view.dirty = true;
}

function measure(kind) {
  const apl = averagePathLength();
  if (kind !== undefined) history.push({ shortcuts: shortcuts.size, apl, kind });
  $('nodes').textContent = graph.n;
  $('links').textContent = graph.edges.length;
  $('shortcuts').textContent = shortcuts.size;
  $('apl').textContent = Number.isFinite(apl) ? apl.toFixed(2) : 'inf';
  // Plot scale 0..sqrt(N), as in the legacy <D> histogram.
  const top = Math.sqrt(graph.n);
  aplPlot.set(history.map(h => Number.isFinite(h.apl) ? h.apl : top), top, history.map(h => h.kind));
  aplPlot.values = history.map(h => h.apl);
  refresh();
}

function reset() {
  graph = lattice(SIDE, SIDE);
  view.positions = normalizeCoordinates(Array.from({ length: graph.n }, (_, i) => ({ x: i % SIDE, y: Math.floor(i / SIDE) })));
  source = -1;
  shortcuts = new Set();
  history = [];
  events = [];
  view.ghosts = [];
  relayout();
  measure('');
}

// A shortcut from a to b (0-based) replaces a random lattice link, so the
// number of links stays the same (rewiring). The removed link fades in red.
function addShortcut(a, b, kind) {
  const id = key(a + 1, b + 1);
  if (a === b || graph.edges.some(e => key(e.source, e.target) === id)) return false;
  const lattice = graph.edges.filter(e => !isShortcut(e));
  if (!lattice.length) return false;
  const removed = lattice[Math.floor(Math.random() * lattice.length)];
  graph.edges = graph.edges.filter(e => e !== removed);
  graph.edges.push({ source: a + 1, target: b + 1 });
  shortcuts.add(id);
  events.push({ type: 'shortcut', link: [a, b], removed: [removed.source - 1, removed.target - 1] });
  relayout();
  view.showGhost([removed.source - 1, removed.target - 1]);
  measure(kind);
  return true;
}

// Left-click: pick the source endpoint, then the target endpoint.
$('canvas').addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  const hit = view.nodeAt(event, { reach: 10, accept: i => k[i] > 0 });
  if (hit.node < 0) return;
  if (source < 0) {
    source = hit.node;
    refresh();
  } else {
    const a = source;
    source = -1;
    if (!addShortcut(a, hit.node, '')) refresh();
  }
  view.showNode(hit.node, event);
});

// Random Shortcut: strategy (a) of Q11, a shortcut between two random nodes.
$('random-shortcut').addEventListener('click', () => {
  source = -1;
  for (let tries = 0; tries < 100; tries++) {
    const a = Math.floor(Math.random() * graph.n), b = Math.floor(Math.random() * graph.n);
    if (k[a] > 0 && k[b] > 0 && addShortcut(a, b, 'random')) return;
  }
});

// Failures: remove 10 random links. Each one snaps, with a spark at the break. (Links, not nodes: a failed node would cut itself off the grid and
// the average path length would become inf.)
$('failures').addEventListener('click', () => {
  const removed = [];
  for (let i = 0; i < 10 && graph.edges.length; i++) {
    const link = graph.edges.splice(Math.floor(Math.random() * graph.edges.length), 1)[0];
    shortcuts.delete(key(link.source, link.target));
    removed.push(link);
  }
  events.push({ type: 'failures', removed: removed.map(l => [l.source - 1, l.target - 1]) });
  relayout();
  measure('failure');
  for (const { source: a, target: b } of removed) view.snapLink(a - 1, b - 1);
});

bindCopy($('copy'), () => ({
  header: ['shortcuts', 'average_path_length', 'change'],
  rows: history.map(h => [h.shortcuts, Number.isFinite(h.apl) ? h.apl.toFixed(3) : 'inf', h.kind || (h.shortcuts ? 'shortcut' : 'start')]),
}));

// --- Class mode: Send (only when served by class_server.py) ----------------

const dialog = $('send-dialog'), nick = $('nick'), status = $('send-status');
const NICK_KEY = 'netlab-nick';

fetch('/api/info').then(r => r.ok ? r.json() : null).then(info => {
  if (info?.class) $('send').hidden = false;
}).catch(() => {});

$('send').addEventListener('click', () => {
  try { nick.value = localStorage.getItem(NICK_KEY) || ''; } catch {}
  $('send-shortcuts').textContent = shortcuts.size;
  $('send-apl').textContent = $('apl').textContent;
  status.textContent = '';
  status.classList.remove('error');
  $('send-ok').disabled = false;
  dialog.hidden = false;
  nick.focus();
});
$('send-cancel').addEventListener('click', () => { dialog.hidden = true; });
dialog.addEventListener('keydown', event => { if (event.key === 'Escape') dialog.hidden = true; });

$('send-form').addEventListener('submit', async event => {
  event.preventDefault();
  const name = nick.value.trim();
  if (!/^[A-Za-z0-9]{1,8}$/.test(name)) {
    status.textContent = 'Nickname: 1-8 letters or digits';
    status.classList.add('error');
    return;
  }
  try { localStorage.setItem(NICK_KEY, name); } catch {}
  $('send-ok').disabled = true;
  status.classList.remove('error');
  status.textContent = 'Sending...';
  try {
    const response = await fetch('/api/06/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nick: name, events }),
    });
    const reply = await response.json();
    if (!response.ok) throw new Error(reply.error || 'Not sent');
    status.textContent = 'Sent';
    setTimeout(() => { dialog.hidden = true; }, 900);
  } catch (err) {
    status.textContent = err.message === 'Failed to fetch' ? 'Not sent: no connection' : err.message;
    status.classList.add('error');
    $('send-ok').disabled = false;
  }
});

bindSpeed($('speed'), $('speed-value'), view);
bindLayoutParams(document, params, view);
$('reset').addEventListener('click', reset);

initScale($('scale-down'), $('scale-up'));
onScale(() => { view.dirty = true; });
reset();
