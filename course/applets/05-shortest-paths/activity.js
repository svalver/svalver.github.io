// Port of old_applets/netfail/main_exp2.cpp ("Network Distance - by @svalver 2016-2026").
import {
  parseEdgeList, degrees, disconnect, randomConnectedNode,
  distancesFrom, geodesics, distanceStats, globalEfficiency,
} from '../shared/graph.js?v=ee62343c';
import { normalizeCoordinates } from '../shared/force-layout.js?v=ee62343c';
import { initScale, onScale } from '../shared/netlab-scale.js?v=ee62343c';
import { NetworkView, Histogram, bindCopy } from '../shared/netlab-ui.js?v=ee62343c';
import { vertexCoord, edgeList } from '../shared/city.js?v=ee62343c';

const $ = id => document.getElementById(id);

// No layout: the city keeps its coordinates. Nodes left without links are dark.
const view = new NetworkView($('canvas'), { pad: 0, nodeOff: 'rgb(26,26,51)' });
const distancePlot = new Histogram($('distance-plot'), 'Distance');
const coordinates = vertexCoord.trim().split('\n').map(line => {
  const [x, y] = line.split(/\s+/).map(Number);
  return { x, y };
});

let graph, k, first, second, failures, history, route, fromFirst;

// Distance rings from the first node: warm and bright near it, cool and dim
// far away, like a travel-time map.
const RING = [[255, 255, 160], [255, 170, 60], [230, 80, 110], [140, 80, 210], [70, 80, 170]];
function ringColor(d, max) {
  const t = Math.min(1, d / Math.max(1, max)) * (RING.length - 1);
  const i = Math.min(RING.length - 2, Math.floor(t)), f = t - i;
  const c = RING[i].map((v, j) => Math.round(v + (RING[i + 1][j] - v) * f));
  return `rgb(${c})`;
}

// Route between the selected pair: all shortest paths, and the one drawn in
// bright yellow. The drawn route is kept while it still works, as a map
// keeps its route until it is blocked.
function updateRoute() {
  if (first < 0 || second < 0) { route = null; return; }
  const g = geodesics(graph, first, second);
  const stillValid = route?.path && route.path.length - 1 === g.distance &&
    route.path.every((i, step) => !step || graph.edges.some(({ source, target }) =>
      (source - 1 === i && target - 1 === route.path[step - 1]) ||
      (target - 1 === i && source - 1 === route.path[step - 1])));
  route = { ...g, path: stillValid ? route.path : g.path };
}

function measure({ record = false } = {}) {
  k = degrees(graph);
  view.set(graph, view.positions, k, null);
  updateRoute();
  fromFirst = first >= 0 ? distancesFrom(graph, first).dist : null;
  const eccentricity = fromFirst ? Math.max(0, ...fromFirst.filter(Number.isFinite)) : 0;
  const { diameter, meanDistance } = distanceStats(graph);
  const efficiency = globalEfficiency(graph);
  const distance = route ? route.distance : 0;

  // Rings while choosing the second node; the route once both are chosen.
  view.nodeColor = first >= 0 && second < 0
    ? i => (i === first ? null : Number.isFinite(fromFirst[i]) && k[i] > 0 ? ringColor(fromFirst[i], eccentricity) : null)
    : null;
  view.nodeInfo = fromFirst ? i => `d = ${Number.isFinite(fromFirst[i]) ? fromFirst[i] : 'inf'}` : null;
  view.highlight = {
    nodes: [first, second].filter(i => i >= 0),
    labels: ['A', 'B'],
    path: route?.path,
    links: route?.links,
  };

  $('nodes').textContent = graph.n;
  $('links').textContent = graph.edges.length;
  $('distance').textContent = Number.isFinite(distance) ? distance : 'inf';
  $('paths').textContent = route ? route.count : 0;
  $('eccentricity').textContent = eccentricity;
  $('diameter').textContent = diameter;
  $('mean-distance').textContent = meanDistance.toFixed(2);
  $('efficiency').textContent = efficiency.toFixed(3);
  $('failures').textContent = failures;
  $('instruction').textContent = first >= 0 && second < 0
    ? 'Left-click to select the second node.'
    : 'Left-click to select the first node.';

  if (record) history.push({ failures, distance, paths: route ? route.count : 0, efficiency, diameter, meanDistance });
  const finite = history.map(h => h.distance).filter(Number.isFinite);
  const max = Math.max(1, ...finite);
  distancePlot.set(history.map(h => Number.isFinite(h.distance) ? h.distance : max), max,
    history.map(h => Number.isFinite(h.distance) ? '' : 'unreachable'));
  distancePlot.values = history.map(h => h.distance); // tooltip shows inf for disconnected pairs
}

function reset() {
  graph = parseEdgeList(edgeList);
  graph.n = coordinates.length;
  view.positions = normalizeCoordinates(coordinates);
  first = second = -1;
  failures = 0;
  history = [];
  route = null;
  view.ghosts = [];
  measure();
}

// Left-click: pick A, then B; the shortest path between them is drawn in
// yellow. Only nodes that still have links can be picked.
$('canvas').addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  const hit = view.nodeAt(event, { reach: 10, accept: i => k[i] > 0 });
  if (hit.node < 0) return;
  route = null;
  history = [];
  if (first < 0 || second >= 0) {
    first = hit.node;
    second = -1;
    measure();
  } else {
    second = hit.node;
    measure({ record: true });
  }
  view.showNode(hit.node, event);
});

// Failure: disconnect a random node. If it was on the route, the old route
// flashes red and the new shortest route is drawn ("recalculating").
$('failure').addEventListener('click', () => {
  const i = randomConnectedNode(k);
  if (i < 0) return;
  const old = route?.path;
  disconnect(graph, i);
  failures++;
  measure({ record: second >= 0 });
  view.flash(i, 'failure');
  if (old?.includes(i)) view.showGhost(old);
});

bindCopy($('copy'), () => ({
  header: ['failures', 'distance', 'shortest_paths', 'efficiency', 'diameter', 'mean_distance'],
  rows: history.map(h => [
    h.failures, Number.isFinite(h.distance) ? h.distance : 'inf', h.paths,
    h.efficiency.toFixed(4), h.diameter, h.meanDistance.toFixed(3),
  ]),
}));

$('reset').addEventListener('click', reset);

initScale($('scale-down'), $('scale-up'));
onScale(() => { view.dirty = true; });
reset();
