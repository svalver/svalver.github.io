// Undirected simple graphs with 1-based node IDs, as in the legacy Netlab applets.
// N is the largest node ID in the edge list; unused IDs below it are isolated nodes.

export const MAX_NODES = 256;

export function parseEdgeList(text, maxNodes = MAX_NODES) {
  const edges = [];
  const seen = new Set();
  let n = 0;
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const parts = line.split(/[\s,;]+/);
    if (parts.length !== 2 || !parts.every(part => /^\d+$/.test(part))) {
      throw new Error(`Line ${i + 1}: expected two node IDs`);
    }
    const [a, b] = parts.map(Number);
    if (a < 1 || b < 1) throw new Error(`Line ${i + 1}: node IDs start at 1`);
    if (a > maxNodes || b > maxNodes) throw new Error(`Line ${i + 1}: node IDs must be <= ${maxNodes}`);
    if (a === b) throw new Error(`Line ${i + 1}: self-loop ${a} ${b}`);
    n = Math.max(n, a, b);
    const key = a < b ? `${a}:${b}` : `${b}:${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    edges.push({ source: a, target: b });
  }
  return { n, edges };
}

export function degrees(graph) {
  const k = Array(graph.n).fill(0);
  for (const { source, target } of graph.edges) {
    k[source - 1]++;
    k[target - 1]++;
  }
  return k;
}

// P(k) as fractions of nodes, for k = 0..max(k).
export function degreeDistribution(k) {
  if (!k.length) return [];
  const pk = Array(Math.max(...k) + 1).fill(0);
  for (const value of k) pk[value]++;
  return pk.map(count => count / k.length);
}

// G(N, p): each of the N(N-1)/2 pairs is linked with probability p.
export function randomGraph(n, p, random = Math.random) {
  const edges = [];
  for (let a = 1; a < n; a++) {
    for (let b = a + 1; b <= n; b++) {
      if (random() < p) edges.push({ source: a, target: b });
    }
  }
  return { n, edges };
}

// Size of the largest connected component, as a fraction of N.
export function largestComponentFraction(graph) {
  if (!graph.n) return 0;
  const parent = Array.from({ length: graph.n }, (_, i) => i);
  const find = i => { while (parent[i] !== i) i = parent[i] = parent[parent[i]]; return i; };
  for (const { source, target } of graph.edges) {
    const a = find(source - 1), b = find(target - 1);
    if (a !== b) parent[a] = b;
  }
  const size = new Map();
  for (let i = 0; i < graph.n; i++) size.set(find(i), (size.get(find(i)) || 0) + 1);
  return Math.max(...size.values()) / graph.n;
}

// --- Node removal (random failures and targeted attacks) -------------------

// Removes all links of node i (0-based); the node stays, isolated.
export function disconnect(graph, i) {
  const id = i + 1;
  graph.edges = graph.edges.filter(({ source, target }) => source !== id && target !== id);
}

const randomOf = list => list[Math.floor(Math.random() * list.length)];
const connected = k => k.flatMap((d, i) => d > 0 ? [i] : []);

// A random node that still has links, or -1.
export function randomConnectedNode(k) {
  const nodes = connected(k);
  return nodes.length ? randomOf(nodes) : -1;
}

// The node with most links (ties broken at random), or -1.
export function highestDegreeNode(k) {
  const nodes = connected(k);
  if (!nodes.length) return -1;
  const top = Math.max(...nodes.map(i => k[i]));
  return randomOf(nodes.filter(i => k[i] === top));
}

// --- Distances ---------------------------------------------------------------

function neighbours(graph) {
  const adj = Array.from({ length: graph.n }, () => []);
  for (const { source, target } of graph.edges) {
    adj[source - 1].push(target - 1);
    adj[target - 1].push(source - 1);
  }
  return adj;
}

// Breadth-first search from node s (0-based): distances (Infinity when
// unreachable) and the predecessor of each node on one shortest path.
export function distancesFrom(graph, s, adj = neighbours(graph)) {
  const dist = Array(graph.n).fill(Infinity), pred = Array(graph.n).fill(-1);
  dist[s] = 0;
  const queue = [s];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    for (const v of adj[u]) {
      if (dist[v] === Infinity) { dist[v] = dist[u] + 1; pred[v] = u; queue.push(v); }
    }
  }
  return { dist, pred };
}

// One shortest path from a to b (0-based node indices), or null.
export function shortestPath(graph, a, b) {
  const { dist, pred } = distancesFrom(graph, a);
  if (dist[b] === Infinity) return null;
  const path = [b];
  while (path[0] !== a) path.unshift(pred[path[0]]);
  return path;
}

// Global efficiency (Latora and Marchiori): mean of 1 / d_ij over all ordered
// pairs i ≠ j, with 1 / ∞ = 0.
export function globalEfficiency(graph) {
  const n = graph.n;
  if (n < 2) return 0;
  const adj = neighbours(graph);
  let sum = 0;
  for (let s = 0; s < n; s++) {
    const { dist } = distancesFrom(graph, s, adj);
    for (let t = 0; t < n; t++) if (t !== s && dist[t] < Infinity) sum += 1 / dist[t];
  }
  return sum / (n * (n - 1));
}

// All shortest paths from a to b (0-based): the distance, how many there are,
// the links that lie on at least one of them, and one of them as a node list.
// When a and b are d apart, count equals the (a, b) entry of A^d.
export function geodesics(graph, a, b) {
  const adj = neighbours(graph);
  const from = distancesFrom(graph, a, adj), to = distancesFrom(graph, b, adj);
  const d = from.dist[b];
  if (d === Infinity) return { distance: Infinity, count: 0, links: [], path: null };
  const count = Array(graph.n).fill(0);
  count[a] = 1;
  const order = Array.from({ length: graph.n }, (_, i) => i)
    .filter(i => from.dist[i] < Infinity).sort((i, j) => from.dist[i] - from.dist[j]);
  for (const u of order) for (const v of adj[u]) if (from.dist[v] === from.dist[u] + 1) count[v] += count[u];
  const links = [];
  for (const { source, target } of graph.edges) {
    const u = source - 1, v = target - 1;
    if (from.dist[u] + 1 + to.dist[v] === d || from.dist[v] + 1 + to.dist[u] === d) links.push([u, v]);
  }
  const path = [b];
  while (path[0] !== a) path.unshift(from.pred[path[0]]);
  return { distance: d, count: count[b], links, path };
}

// Diameter (longest finite shortest path) and mean distance over all pairs of
// nodes that are connected.
export function distanceStats(graph) {
  const adj = neighbours(graph);
  let diameter = 0, sum = 0, pairs = 0;
  for (let s = 0; s < graph.n; s++) {
    const { dist } = distancesFrom(graph, s, adj);
    for (let t = s + 1; t < graph.n; t++) {
      if (dist[t] < Infinity) { diameter = Math.max(diameter, dist[t]); sum += dist[t]; pairs++; }
    }
  }
  return { diameter, meanDistance: pairs ? sum / pairs : 0 };
}

// Two-dimensional lattice of nx × ny nodes (create_lattice in main_exp4.cpp):
// node i sits at column i % nx, row floor(i / nx), linked to its 4 neighbours.
export function lattice(nx, ny) {
  const edges = [];
  for (let r = 0; r < ny; r++) {
    for (let c = 0; c < nx; c++) {
      const id = r * nx + c + 1;
      if (c < nx - 1) edges.push({ source: id, target: id + 1 });
      if (r < ny - 1) edges.push({ source: id, target: id + nx });
    }
  }
  return { n: nx * ny, edges };
}
