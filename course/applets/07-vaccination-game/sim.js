// Epidemic of main_vaccine.cpp (2017) as a pure, seeded simulation, so that
// a game can be replayed exactly (class_server.py mirrors this file).
//
// States: 0 susceptible, 1 infected, 2 recovered (vaccinated, quarantined or
// isolated). Each step, every infected node infects each susceptible
// neighbour with probability P_INFECT; nodes are visited in ID order and
// neighbours in ascending ID order, so a node infected earlier in the same
// step can already spread (as in the legacy loop).

export const S = 0, I = 1, R = 2;
export const P_INFECT = .023;
export const STEPS_PER_SECOND = 60;   // the legacy game spread once per frame at 60 fps

// mulberry32: a small 32-bit PRNG with the same sequence in JS and Python.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Epidemic {
  // n nodes, edges as [a, b] pairs of 0-based IDs.
  constructor(n, edges, seed, pInfect = P_INFECT) {
    this.n = n;
    this.p = pInfect;
    this.random = rng(seed);
    this.adj = Array.from({ length: n }, () => new Set());
    for (const [a, b] of edges) { this.adj[a].add(b); this.adj[b].add(a); }
    this.state = Array(n).fill(S);
    for (let i = 0; i < n; i++) if (!this.adj[i].size) this.state[i] = R;  // isolated: immune
    this.steps = 0;
  }

  // Vaccination or quarantine: a susceptible node becomes recovered and loses its links.
  isolate(i) {
    if (this.state[i] !== S) return false;
    this.state[i] = R;
    for (const j of this.adj[i]) this.adj[j].delete(i);
    this.adj[i].clear();
    return true;
  }

  // startInfection(): each susceptible node is infected with probability p,
  // repeated until at least one is.
  start() {
    for (let infected = false; !infected;) {
      for (let i = 0; i < this.n; i++) {
        if (this.state[i] === S && this.random() <= this.p) { this.state[i] = I; infected = true; }
      }
    }
  }

  // spreadInfection(): one step.
  step() {
    for (let i = 0; i < this.n; i++) {
      if (this.state[i] !== I) continue;
      for (const j of [...this.adj[i]].sort((x, y) => x - y)) {
        if (this.state[j] === S && this.random() < this.p) this.state[j] = I;
      }
    }
    this.steps++;
  }

  // exhaustedEpidemic(): no susceptible node is linked to an infected one
  // (every component with an infected node is fully infected).
  exhausted() {
    for (let i = 0; i < this.n; i++) {
      if (this.state[i] !== I) continue;
      for (const j of this.adj[i]) if (this.state[j] === S) return false;
    }
    return true;
  }

  counts() {
    const c = [0, 0, 0];
    for (const s of this.state) c[s]++;
    return { healthy: c[S], infected: c[I], vaccinated: c[R] };
  }

  get edges() {
    const out = [];
    for (let a = 0; a < this.n; a++) for (const b of this.adj[a]) if (a < b) out.push([a, b]);
    return out;
  }
}

// Replays a game: vaccinated nodes, then the epidemic with quarantines
// [step, node] applied before the spread of that step. Returns the score
// (nodes not infected) and the final Epidemic.
export function replay(city, game, onStep) {
  const e = new Epidemic(city.positions.length, city.edges, game.seed);
  for (const i of game.vaccinated) e.isolate(i);
  e.start();
  const quarantines = [...game.quarantined];
  let q = 0;
  while (true) {
    while (q < quarantines.length && quarantines[q][0] === e.steps) e.isolate(quarantines[q++][1]);
    e.step();
    onStep?.(e);
    if (e.exhausted()) break;
  }
  return { score: e.n - e.counts().infected, epidemic: e };
}
