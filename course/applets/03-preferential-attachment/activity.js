// Port of old_applets/netfail/main_exp6.cpp ("Preferential Attachment - by @svalver 2016-2026"),
// preferential-attachment branch (the rule in the published exp6 build).
import { degrees, degreeDistribution, largestComponentFraction, disconnect, randomConnectedNode, highestDegreeNode } from '../shared/graph.js?v=ee62343c';
import { ForceLayout } from '../shared/force-layout.js?v=ee62343c';
import { initScale, onScale } from '../shared/netlab-scale.js?v=ee62343c';
import { NetworkView, Histogram, bindSpeed, bindLayoutParams, bindCopy, gccTable } from '../shared/netlab-ui.js?v=ee62343c';

const $ = id => document.getElementById(id);

// Layout defaults of main_exp6.cpp.
const params = { distance: .03, theta: 1, charge: -.0035, strength: .4, gravity: .9, friction: .3 };
const experiment = { size: 250, degree: 1, constant: false };

// Nodes and links are drawn grey; nodes left without links are dark. Node
// size grows with the logarithm of degree, so hubs stand out.
const view = new NetworkView($('canvas'), { pad: 0, node: 'rgb(179,179,179)', nodeOff: 'rgb(26,26,51)', sizeByDegree: true });
const pk = new Histogram($('pk'), 'P(k)');
const gccPlot = new Histogram($('gcc-plot'), 'GCC');
let graph = { n: 0, edges: [] };
let gccHistory = [];
let gccKinds = [];   // removal behind each GCC bar
let attacks = 0, failures = 0;
let grown = false;

// Limits applied by the legacy panel on every frame.
function clampExperiment() {
  experiment.size = Math.max(2, Math.min(400, Math.round(experiment.size)));
  experiment.degree = Math.max(1, Math.min(5, Math.round(experiment.degree)));
}

// A new layout keeps the current positions and starts with zero velocity (resetLayout).
function relayout(options) {
  const layout = new ForceLayout(view.positions, graph.edges, params, { bothDirections: false });
  view.set(graph, view.positions, degrees(graph), layout, options);
}

function measure({ record }) {
  const p = degreeDistribution(degrees(graph));
  const gcc = largestComponentFraction(graph);
  $('nodes').textContent = graph.n;
  $('links').textContent = graph.edges.length;
  pk.set(p);
  $('max-degree').textContent = p.length ? p.length - 1 : 0;
  $('attacks').textContent = attacks;
  $('failures').textContent = failures;
  $('gcc').textContent = gcc.toFixed(2);
  $('gcc').classList.toggle('low', gcc < .5);
  if (record) {
    gccHistory.push(gcc);
    gccPlot.set(gccHistory, 1, gccKinds);
  }
}

// Seed: two linked nodes near the gravity point (create_random_subnetwork, resetLayout).
function reset() {
  clampExperiment();
  graph = { n: 2, edges: [{ source: 1, target: 2 }] };
  view.positions = Array.from({ length: 2 }, () => ({
    x: .5 + params.distance * .5 * (2 * Math.random() - 1),
    y: .5 + params.distance * .5 * (2 * Math.random() - 1),
  }));
  relayout();
  gccHistory = [];
  gccKinds = [];
  attacks = failures = 0;
  measure({ record: true });
}

// One growth step: the new node links to the endpoint of a random link (so a
// node is chosen with probability proportional to its degree), then to
// Degree - 1 more nodes chosen the same way. Without Constant Degree the extra
// links are 0 .. Degree - 1, uniformly.
function grow() {
  if (graph.n >= experiment.size || !graph.edges.length) return;
  const edges = graph.edges;
  const pick = () => {
    const { source, target } = edges[Math.floor(Math.random() * edges.length)];
    return Math.random() < .5 ? source : target;
  };
  const extra = experiment.constant ? experiment.degree - 1 : Math.floor(Math.random() * experiment.degree);
  const wanted = Math.min(1 + extra, graph.n);
  const targets = new Set();
  for (let tries = 0; targets.size < wanted && tries < 100; tries++) targets.add(pick());

  const first = view.positions[[...targets][0] - 1];
  view.positions.push({ x: first.x + .01 * (2 * Math.random() - 1), y: first.y + .01 * (2 * Math.random() - 1) });
  graph.n++;
  for (const t of targets) edges.push({ source: graph.n, target: t });
  relayout({ keepDrag: true });
  grown = true;
}

view.beforeStep = grow;

// Failure: disconnect a random node. Attack: disconnect the node with most links.
function removeNode(pick, kind) {
  const i = pick(degrees(graph));
  if (i < 0) return false;
  disconnect(graph, i);
  relayout({ keepDrag: true });
  view.flash(i, kind);
  gccKinds[gccHistory.length] = kind;
  return true;
}
function failure() { if (removeNode(randomConnectedNode, 'failure')) { failures++; measure({ record: true }); } }
function attack() { if (removeNode(highestDegreeNode, 'attack')) { attacks++; measure({ record: true }); } }

// Growth measures are refreshed once per frame.
(function refresh() {
  if (grown) { grown = false; measure({ record: false }); }
  requestAnimationFrame(refresh);
})();

// --- Controls --------------------------------------------------------------

bindSpeed($('speed'), $('speed-value'), view);
view.speed = Number($('speed').value); // starts at 50 (legacy: 0)
bindLayoutParams(document, params, view);

function bindInt(name, input, minus, plus) {
  const show = () => { input.value = experiment[name]; };
  input.addEventListener('input', () => {
    const value = Number(input.value);
    if (input.value.trim() !== '' && Number.isFinite(value)) { experiment[name] = value; clampExperiment(); }
  });
  input.addEventListener('change', show);
  minus.addEventListener('click', () => { experiment[name]--; clampExperiment(); show(); });
  plus.addEventListener('click', () => { experiment[name]++; clampExperiment(); show(); });
  show();
}
bindInt('size', $('size'), $('size-minus'), $('size-plus'));
bindInt('degree', $('degree'), $('degree-minus'), $('degree-plus'));
$('constant').checked = experiment.constant;
$('constant').addEventListener('change', () => { experiment.constant = $('constant').checked; });

$('reset').addEventListener('click', reset);
$('failure').addEventListener('click', failure);
$('attack').addEventListener('click', attack);
bindCopy($('copy'), () => gccTable(gccHistory, graph.n, gccKinds));

initScale($('scale-down'), $('scale-up'));
onScale(() => { view.dirty = true; });
reset();
