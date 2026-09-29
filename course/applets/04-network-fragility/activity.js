// Port of old_applets/netfail/main_exp1.cpp ("Network Fragmentation - by @svalver 2016-2026").
import { parseEdgeList, degrees, largestComponentFraction, disconnect, randomConnectedNode, highestDegreeNode } from '../shared/graph.js?v=ee62343c';
import { normalizeCoordinates } from '../shared/force-layout.js?v=ee62343c';
import { initScale, onScale } from '../shared/netlab-scale.js?v=ee62343c';
import { NetworkView, Histogram, bindCopy, gccTable } from '../shared/netlab-ui.js?v=ee62343c';
import { vertexCoord, edgeList } from '../shared/city.js?v=ee62343c';

const $ = id => document.getElementById(id);

// Nodes with no links left are drawn dark (col_nodes_off). No layout: the
// city keeps its coordinates, so nodes cannot be dragged.
const view = new NetworkView($('canvas'), { pad: 0, nodeOff: 'rgb(26,26,51)' });
const gccPlot = new Histogram($('gcc-plot'), 'GCC');
const coordinates = vertexCoord.trim().split('\n').map(line => {
  const [x, y] = line.split(/\s+/).map(Number);
  return { x, y };
});

let graph, k, attacks, failures, gccHistory, gccKinds;

function components(g) {
  const parent = Array.from({ length: g.n }, (_, i) => i);
  const find = i => { while (parent[i] !== i) i = parent[i] = parent[parent[i]]; return i; };
  for (const { source, target } of g.edges) parent[find(source - 1)] = find(target - 1);
  return new Set(parent.map((_, i) => find(i))).size;
}

function measure() {
  k = degrees(graph);
  view.set(graph, view.positions, k, null);
  const gcc = largestComponentFraction(graph);
  $('nodes').textContent = graph.n;
  $('links').textContent = graph.edges.length;
  $('attacks').textContent = attacks;
  $('failures').textContent = failures;
  $('gcc').textContent = gcc.toFixed(2);
  $('gcc').classList.toggle('low', gcc < .5);
  $('components').textContent = components(graph);
  gccHistory.push(gcc);
  gccPlot.set(gccHistory, 1, gccKinds);
}

function reset() {
  graph = parseEdgeList(edgeList);
  graph.n = coordinates.length;
  view.positions = normalizeCoordinates(coordinates);
  attacks = 0;
  failures = 0;
  gccHistory = [];
  gccKinds = [];
  measure();
}

// Left-click: disconnect the nearest node that still has links, within 10 px.
$('canvas').addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  const hit = view.nodeAt(event, { reach: 10, accept: i => k[i] > 0 });
  if (hit.node < 0) return;
  disconnect(graph, hit.node);
  attacks++;
  gccKinds[gccHistory.length] = 'attack';
  measure();
  view.flash(hit.node, 'attack');
  view.showNode(hit.node, event);
});

// Failure: disconnect a random node that still has links.
$('failure').addEventListener('click', () => {
  const i = randomConnectedNode(k);
  if (i < 0) return;
  disconnect(graph, i);
  failures++;
  gccKinds[gccHistory.length] = 'failure';
  measure();
  view.flash(i, 'failure');
});

// Attack: disconnect the node with most links.
$('attack').addEventListener('click', () => {
  const i = highestDegreeNode(k);
  if (i < 0) return;
  disconnect(graph, i);
  attacks++;
  gccKinds[gccHistory.length] = 'attack';
  measure();
  view.flash(i, 'attack');
});

bindCopy($('copy'), () => gccTable(gccHistory, graph.n, gccKinds));

$('reset').addEventListener('click', reset);
$('run').addEventListener('click', () => { $('components').textContent = components(graph); });

initScale($('scale-down'), $('scale-up'));
onScale(() => { view.dirty = true; });
reset();
