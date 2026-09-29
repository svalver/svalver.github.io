// Port of old_applets/netfail/main_exp5.cpp ("Network Modularity - by @svalver 2016-2026").
import { degrees, largestComponentFraction } from '../shared/graph.js?v=ee62343c';
import { ForceLayout, normalizeCoordinates } from '../shared/force-layout.js?v=ee62343c';
import { initScale, onScale } from '../shared/netlab-scale.js?v=ee62343c';
import { NetworkView, Histogram, bindSpeed, bindLayoutParams, bindFloat, bindCopy } from '../shared/netlab-ui.js?v=ee62343c';
import { randomModularGraph, communities, moduleColor, moduleOf, pairCounts } from './modularity.js?v=ee62343c';

const $ = id => document.getElementById(id);

// Layout defaults of main_exp5.cpp.
const params = { distance: .03, theta: 1, charge: -.004, strength: .4, gravity: .2, friction: .3 };
const experiment = { size: 100, modules: 4, pIntra: .6, pInter: .01 };

// Links are drawn grey (0.7), nodes in the colour of their community.
const view = new NetworkView($('canvas'), { pad: 0, edge: 'rgb(179,179,179)' });
const gccPlot = new Histogram($('gcc-plot'), 'GCC');
let graph = { n: 0, edges: [] };
let found = { community: [], count: 0, q: 0 };
let gccHistory = [];
let model = { ...experiment, expected: 0 }; // parameters of the current network
let removed = 0;                            // links removed by Failure
const runs = [];                            // one row per network state (Copy)

// Nodes are coloured by the modules found, or by the planted modules.
const planted = i => moduleOf(i, model.size, model.modules);
view.nodeColor = i => $('planted').checked
  ? moduleColor(planted(i), model.modules)
  : moduleColor(found.community[i], found.count);
view.nodeInfo = i => `module ${found.community[i] + 1} (planted ${planted(i) + 1})`;

// Limits applied by resetExperiment().
function clampExperiment() {
  experiment.size = Math.max(1, Math.min(256, Math.round(experiment.size)));
  experiment.modules = Math.max(1, Math.min(experiment.size, Math.round(experiment.modules)));
  experiment.pIntra = Math.max(0, Math.min(1, experiment.pIntra));
  experiment.pInter = Math.max(0, Math.min(1, experiment.pInter));
}

// A new layout keeps the current positions and starts with zero velocity (resetLayout).
function relayout(options, positions = view.positions) {
  view.set(graph, positions, degrees(graph), new ForceLayout(positions, graph.edges, params), options);
}

// computeModularity() and ComputeCC(): the communities found, their Q and the GCC.
function measure() {
  found = communities(graph);
  const gcc = largestComponentFraction(graph);
  $('nodes').textContent = graph.n;
  $('links').textContent = graph.edges.length;
  $('expected').textContent = model.expected.toFixed(1);
  $('q').textContent = found.q.toFixed(3);
  $('found').textContent = found.count;
  $('gcc').textContent = gcc.toFixed(2);
  $('gcc').classList.toggle('low', gcc < .5);
  gccHistory.push(gcc);
  gccPlot.set(gccHistory, 1);
  const { size, modules, pIntra, pInter, expected } = model;
  runs.push([size, modules, pIntra, pInter, removed, graph.edges.length, expected.toFixed(1),
    found.q.toFixed(4), found.count, gcc.toFixed(4)]);
  view.dirty = true;
}

function reset() {
  clampExperiment();
  const { size, modules, pIntra, pInter } = experiment;
  const { w, b } = pairCounts(size, modules);
  model = { size, modules, pIntra, pInter, expected: pIntra * w + pInter * b };
  removed = 0;
  graph = randomModularGraph(size, modules, pIntra, pInter);
  // create_random_modular(): the nodes start on a circle, in order, so each
  // module is an arc.
  const circle = Array.from({ length: size }, (_, i) => {
    const a = 2 * Math.PI * i / size;
    return { x: size * Math.cos(a), y: size * Math.sin(a) };
  });
  relayout({}, normalizeCoordinates(circle));
  gccHistory = [];
  measure();
}

// Failure: remove 10 random links, each snapping, then recompute the communities.
function failure() {
  if (!graph.edges.length) return;
  const cut = [];
  for (let r = 0; r < 10 && graph.edges.length; r++) {
    cut.push(...graph.edges.splice(Math.floor(Math.random() * graph.edges.length), 1));
  }
  removed += cut.length;
  relayout({ keepDrag: true });
  for (const { source, target } of cut) view.snapLink(source - 1, target - 1);
  measure();
}

// --- Controls --------------------------------------------------------------

bindSpeed($('speed'), $('speed-value'), view);
view.speed = Number($('speed').value); // starts at 50 (legacy: 0)
bindLayoutParams(document, params, view);

const showExperiment = () => {
  $('size').value = experiment.size;
  $('modules').value = experiment.modules;
  $('p-intra').value = experiment.pIntra.toFixed(6);
  $('p-inter').value = experiment.pInter.toFixed(6);
};
for (const name of ['size', 'modules']) {
  const input = $(name);
  input.addEventListener('input', () => {
    const value = Number(input.value);
    if (input.value.trim() !== '' && Number.isFinite(value)) { experiment[name] = value; clampExperiment(); }
  });
  input.addEventListener('change', showExperiment);
  $(`${name}-minus`).addEventListener('click', () => { experiment[name]--; clampExperiment(); showExperiment(); });
  $(`${name}-plus`).addEventListener('click', () => { experiment[name]++; clampExperiment(); showExperiment(); });
}
for (const [id, name] of [['p-intra', 'pIntra'], ['p-inter', 'pInter']]) {
  bindFloat($(id), () => experiment[name], value => { experiment[name] = value; clampExperiment(); });
  $(id).addEventListener('change', showExperiment);
}

$('reset').addEventListener('click', reset);
$('failure').addEventListener('click', failure);
$('planted').addEventListener('change', () => { view.dirty = true; });
bindCopy($('copy'), () => ({
  header: ['N', 'M', 'p', 'q', 'removed', 'L', 'E[L]', 'Q', 'found', 'gcc'],
  rows: runs,
}));

initScale($('scale-down'), $('scale-up'));
onScale(() => { view.dirty = true; });
showExperiment();
reset();
