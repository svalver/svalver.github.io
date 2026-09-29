// Random modular networks and modularity, after main_exp5.cpp and the
// Community class of old_applets/netfail/graphfun.cpp (Louvain method).

// Module of node i (0-based) when N nodes are split into M modules whose
// sizes differ by at most one.
export const moduleOf = (i, n, m) => Math.floor(i * m / n);

// RMG(p, q): each pair of nodes in the same module is linked with
// probability p, each pair in different modules with probability q.
export function randomModularGraph(n, m, p, q, random = Math.random) {
  const edges = [];
  for (let a = 1; a < n; a++) {
    for (let b = a + 1; b <= n; b++) {
      const same = moduleOf(a - 1, n, m) === moduleOf(b - 1, n, m);
      if (random() < (same ? p : q)) edges.push({ source: a, target: b });
    }
  }
  return { n, edges };
}

// Pairs of nodes inside modules (W) and between modules (B), so that
// E[L] = pW + qB (questionnaire Q14).
export function pairCounts(n, m) {
  const sizes = Array(m).fill(0);
  for (let i = 0; i < n; i++) sizes[moduleOf(i, n, m)]++;
  const w = sizes.reduce((sum, s) => sum + s * (s - 1) / 2, 0);
  return { w, b: n * (n - 1) / 2 - w };
}

// Q = sum over modules s of [ l_s / L - (d_s / 2L)^2 ] (slides 84-87).
export function modularity(graph, community) {
  const L = graph.edges.length;
  if (!L) return 0;
  const inside = new Map(), degree = new Map();
  const add = (map, c, v) => map.set(c, (map.get(c) || 0) + v);
  for (const { source, target } of graph.edges) {
    const a = community[source - 1], b = community[target - 1];
    if (a === b) add(inside, a, 1);
    add(degree, a, 1);
    add(degree, b, 1);
  }
  let q = 0;
  for (const [c, d] of degree) q += (inside.get(c) || 0) / L - (d / (2 * L)) ** 2;
  return q;
}

// --- Louvain method --------------------------------------------------------

// One level of Community::one_level() on a weighted graph given as adjacency
// maps (self-loops hold twice the weight inside a community). Nodes are
// visited in order and move to the neighbouring community of largest gain.
function oneLevel(adj, precision) {
  const size = adj.length;
  const deg = adj.map(m => [...m.values()].reduce((s, w) => s + w, 0));
  const m2 = deg.reduce((s, w) => s + w, 0);
  const n2c = adj.map((_, i) => i);
  const inw = adj.map((m, i) => m.get(i) || 0);
  const tot = deg.slice();
  const q = () => {
    let sum = 0;
    for (let c = 0; c < size; c++) if (tot[c] > 0) sum += inw[c] / m2 - (tot[c] / m2) ** 2;
    return sum;
  };
  let newQ = q(), curQ;
  let improvement;
  do {
    curQ = newQ;
    improvement = false;
    for (let node = 0; node < size; node++) {
      const comm = n2c[node];
      // links from node to each neighbouring community, own community first
      const neigh = new Map([[comm, 0]]);
      for (const [j, w] of adj[node]) if (j !== node) neigh.set(n2c[j], (neigh.get(n2c[j]) || 0) + w);
      const self = adj[node].get(node) || 0;
      tot[comm] -= deg[node];
      inw[comm] -= 2 * neigh.get(comm) + self;
      let best = comm, bestLinks = 0, bestGain = 0;
      for (const c of [...neigh.keys()].sort((x, y) => x - y)) {
        const gain = neigh.get(c) - tot[c] * deg[node] / m2;
        if (gain > bestGain) { best = c; bestLinks = neigh.get(c); bestGain = gain; }
      }
      tot[best] += deg[node];
      inw[best] += 2 * bestLinks + self;
      n2c[node] = best;
      if (best !== comm) improvement = true;
    }
    newQ = q();
  } while (improvement && newQ - curQ > precision);
  return { n2c, q: newQ };
}

// Communities of an undirected graph: an index 0..count-1 per node, numbered
// in order of first appearance, and the modularity Q of that partition.
export function communities(graph, precision = 1e-5) {
  const n = graph.n;
  let adj = Array.from({ length: n }, () => new Map());
  for (const { source, target } of graph.edges) {
    const a = source - 1, b = target - 1;
    adj[a].set(b, (adj[a].get(b) || 0) + 1);
    adj[b].set(a, (adj[b].get(a) || 0) + 1);
  }
  let member = Array.from({ length: n }, (_, i) => i);
  if (!graph.edges.length) return { community: member, count: n, q: 0 };
  let q = -Infinity;
  for (;;) {
    const level = oneLevel(adj, precision);
    if (level.q - q <= precision) break;
    q = level.q;
    // partition2graph(): renumber communities and build the community graph
    const renumber = new Map();
    for (const c of level.n2c) if (!renumber.has(c)) renumber.set(c, renumber.size);
    const next = Array.from({ length: renumber.size }, () => new Map());
    adj.forEach((m, i) => {
      const a = renumber.get(level.n2c[i]);
      for (const [j, w] of m) {
        const b = renumber.get(level.n2c[j]);
        next[a].set(b, (next[a].get(b) || 0) + w);
      }
    });
    member = member.map(c => renumber.get(level.n2c[c]));
    if (next.length === adj.length) break;
    adj = next;
  }
  // number communities in order of their first node
  const order = new Map();
  const community = member.map(c => { if (!order.has(c)) order.set(c, order.size); return order.get(c); });
  return { community, count: order.size, q: modularity(graph, community) };
}

// Colormap::set("HSV") with 64 entries and map2color(index, 0, count).
export function moduleColor(index, count) {
  const entry = count ? Math.floor(Math.min(1, index / count) * 63) : 0;
  let t = entry / 63 * 6;
  let r = 0, g = 0, b = 0;
  if (t <= 1) [r, g, b] = [1, t, 0];
  else if (t <= 2) [r, g, b] = [2 - t, 1, 0];
  else if (t <= 3) [r, g, b] = [0, 1, t - 2];
  else if (t <= 4) [r, g, b] = [0, 4 - t, 1];
  else if (t <= 5) [r, g, b] = [t - 4, 0, 1];
  else [r, g, b] = [1, 0, 6 - t];
  return `rgb(${Math.round(r * 255)},${Math.round(g * 255)},${Math.round(b * 255)})`;
}
