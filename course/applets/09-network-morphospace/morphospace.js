// Network models and the degeneracy-determinism measures of
// old_applets/morphospace (models.cpp, graphfun.cpp). A network is
// { n, edges: [{source, target}] (1-based), directed }. Undirected links can
// be walked both ways; directed links (arcs) only from source to target.

export const NETWORK_SIZE = 50;

const pick = n => Math.floor(Math.random() * n);

// ER: each of the N(N-1)/2 pairs is linked with probability p.
export function erdosRenyi(n, p) {
  const edges = [];
  for (let a = 1; a < n; a++) {
    for (let b = a + 1; b <= n; b++) if (Math.random() < p) edges.push({ source: a, target: b });
  }
  return { n, edges, directed: false };
}

// PA: starts with two linked nodes. Each new node links to the endpoint of a
// random link (a node chosen with probability proportional to its degree),
// then to 0 .. m-1 more nodes chosen the same way, all distinct.
export function preferentialAttachment(n, m) {
  const edges = [{ source: 1, target: 2 }];
  for (let v = 3; v <= n; v++) {
    const wanted = Math.min(1 + pick(m), v - 1);
    const targets = new Set();
    for (let tries = 0; targets.size < wanted && tries < 100; tries++) {
      const e = edges[pick(edges.length)];
      targets.add(Math.random() < .5 ? e.source : e.target);
    }
    for (const t of targets) edges.push({ source: v, target: t });
  }
  return { n, edges, directed: false };
}

// Ring: node i linked to node i+1, and the last to the first.
export function ringLattice(n) {
  const edges = Array.from({ length: n }, (_, i) => ({ source: i + 1, target: i + 2 > n ? 1 : i + 2 }));
  return { n, edges, directed: false };
}

// Star: every node linked to node 1 (MakeSpokeHub).
export function star(n) {
  return { n, edges: Array.from({ length: n - 1 }, (_, i) => ({ source: i + 2, target: 1 })), directed: false };
}

// GNC (growing network with copying): starts with an arc 1 -> 2. Each new
// node v visits m random older nodes t: it links to t with probability p and
// to each node t links to with probability q. Arcs point from new to old.
export function gnc(n, p, q, m) {
  const out = [[2], []];
  for (let v = 3; v <= n; v++) {
    const links = new Set();
    for (let k = 0; k < m; k++) {
      const t = 1 + pick(v - 1);
      if (Math.random() <= p) links.add(t);
      for (const a of out[t - 1]) if (Math.random() <= q) links.add(a);
    }
    out.push([...links]);
  }
  const edges = out.flatMap((targets, i) => targets.map(t => ({ source: i + 1, target: t })));
  return { n, edges, directed: true };
}

// --- Degeneracy and determinism (Hoel, Albantakis & Tononi 2013) -------------

const entropy = ps => ps.reduce((h, p) => p > 0 ? h - p * Math.log2(p) : h, 0);

function outNeighbours(net) {
  const out = Array.from({ length: net.n }, () => []);
  for (const { source, target } of net.edges) {
    out[source - 1].push(target - 1);
    if (!net.directed) out[target - 1].push(source - 1);
  }
  return out;
}

// A random walker leaves node i along each of its out-links with the same
// probability (W_i^out). Only nodes with out-links count (N_out of them).
//   Determinism = log2(N) - <H(W_i^out)>
//   Degeneracy  = log2(N) - H(<W_i^out>)
//   EI = Determinism - Degeneracy = H(<W_i^out>) - <H(W_i^out)>
export function measures(net) {
  const n = net.n;
  if (!n) return { determinism: 0, degeneracy: 0, ei: 0 };
  const out = outNeighbours(net);
  const win = Array(n).fill(0);
  let nout = 0, hout = 0;
  for (const targets of out) {
    if (!targets.length) continue;
    nout++;
    hout += Math.log2(targets.length);            // H of a uniform row
    for (const j of targets) win[j] += 1 / targets.length;
  }
  if (!nout) return { determinism: 0, degeneracy: 0, ei: 0 };
  // both are >= 0; the clamp removes rounding errors like -4e-15
  const determinism = Math.max(0, Math.log2(n) - hout / nout);
  const degeneracy = Math.max(0, Math.log2(n) - entropy(win.map(w => w / nout)));
  return { determinism, degeneracy, ei: determinism - degeneracy };
}

// Pajek file of DiGraph::Write, with each undirected link listed once.
export function pajek(net) {
  const lines = [`*Vertices ${net.n}`];
  for (let i = 0; i < net.n; i++) lines.push(` ${i + 1} "v${i}"`);
  lines.push(net.directed ? '*Arcs' : '*Edges');
  for (const { source, target } of net.edges) lines.push(` ${source} ${target} 1 1`);
  return lines.join('\n') + '\n';
}
