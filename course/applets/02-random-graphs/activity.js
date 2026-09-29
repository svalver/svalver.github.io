// Port of old_applets/netfail/main_exp7.cpp ("Erdos-Renyi Graph - by @svalver 2016-2026").
import { randomGraph, degrees, degreeDistribution, largestComponentFraction, disconnect, randomConnectedNode, highestDegreeNode } from '../shared/graph.js?v=ee62343c';
import { ForceLayout } from '../shared/force-layout.js?v=ee62343c';
import { initScale, onScale } from '../shared/netlab-scale.js?v=ee62343c';
import { NetworkView, Histogram, bindSpeed, bindLayoutParams, bindFloat, bindCopy, gccTable } from '../shared/netlab-ui.js?v=ee62343c';

const $ = id => document.getElementById(id);

// Layout defaults of main_exp7.cpp.
const params = { distance: .03, theta: 1, charge: -.0035, strength: .4, gravity: .9, friction: .3 };
const experiment = { size: 250, probLink: .015 }; // legacy default 0.02; 0.015 matches Q4-Q6

// Nodes and links are drawn grey; nodes left without links are dark. Node
// size grows with the logarithm of degree, as in 03, for comparison.
const view = new NetworkView($('canvas'), { pad: 0, node: 'rgb(179,179,179)', nodeOff: 'rgb(26,26,51)', sizeByDegree: true });
const pk = new Histogram($('pk'), 'P(k)');
const gccPlot = new Histogram($('gcc-plot'), 'GCC');
let graph = { n: 0, edges: [] };
let gccHistory = [];
let gccKinds = [];   // removal behind each GCC bar
let attacks = 0, failures = 0;

// Limits applied by the legacy panel on every frame.
function clampExperiment() {
  experiment.size = Math.max(1, Math.min(250, Math.round(experiment.size)));
  experiment.probLink = Math.max(0, Math.min(1, experiment.probLink));
  if (experiment.probLink * experiment.size > 15) experiment.probLink = 15 / experiment.size;
}

// A new layout keeps the current positions and starts with zero velocity (resetLayout).
function relayout(options, positions = view.positions) {
  view.set(graph, positions, degrees(graph), new ForceLayout(positions, graph.edges, params, { bothDirections: false }), options);
}

function measure() {
  const k = degrees(graph);
  const p = degreeDistribution(k);
  const gcc = largestComponentFraction(graph);
  $('nodes').textContent = graph.n;
  $('links').textContent = graph.edges.length;
  pk.set(p);
  $('max-degree').textContent = p.length ? p.length - 1 : 0;
  $('attacks').textContent = attacks;
  $('failures').textContent = failures;
  $('gcc').textContent = gcc.toFixed(2);
  $('gcc').classList.toggle('low', gcc < .5);
  gccHistory.push(gcc);
  gccPlot.set(gccHistory, 1, gccKinds);
}

function reset() {
  clampExperiment();
  graph = randomGraph(experiment.size, experiment.probLink);
  // resetLayout: nodes start near the gravity point, within ±Distance/2.
  const positions = Array.from({ length: graph.n }, () => ({
    x: .5 + params.distance * .5 * (2 * Math.random() - 1),
    y: .5 + params.distance * .5 * (2 * Math.random() - 1),
  }));
  relayout({}, positions);
  gccHistory = [];
  gccKinds = [];
  attacks = failures = 0;
  measure();
}

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
function failure() { if (removeNode(randomConnectedNode, 'failure')) { failures++; measure(); } }
function attack() { if (removeNode(highestDegreeNode, 'attack')) { attacks++; measure(); } }

// --- Controls --------------------------------------------------------------

bindSpeed($('speed'), $('speed-value'), view);
view.speed = Number($('speed').value); // starts at 50 (legacy: 0)
bindLayoutParams(document, params, view);

const sizeInput = $('size'), probInput = $('prob');
const showExperiment = () => {
  sizeInput.value = experiment.size;
  probInput.value = experiment.probLink.toFixed(6);
};
sizeInput.addEventListener('input', () => {
  const value = Number(sizeInput.value);
  if (sizeInput.value.trim() !== '' && Number.isFinite(value)) { experiment.size = value; clampExperiment(); }
});
sizeInput.addEventListener('change', showExperiment);
$('size-minus').addEventListener('click', () => { experiment.size--; clampExperiment(); showExperiment(); });
$('size-plus').addEventListener('click', () => { experiment.size++; clampExperiment(); showExperiment(); });
bindFloat(probInput, () => experiment.probLink, value => { experiment.probLink = value; clampExperiment(); });
probInput.addEventListener('change', showExperiment);

$('reset').addEventListener('click', reset);
$('failure').addEventListener('click', failure);
$('attack').addEventListener('click', attack);
bindCopy($('copy'), () => gccTable(gccHistory, graph.n, gccKinds));

initScale($('scale-down'), $('scale-up'));
onScale(() => { view.dirty = true; });
showExperiment();
reset();
