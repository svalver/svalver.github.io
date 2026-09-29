// Port of old_applets/netfail/IncrementalForceLayout.cpp (Sergi Valverde, 2015):
// Verlet integration with springs, gravity and Barnes-Hut charge repulsion.
// Positions live in normalized [0,1] coordinates, as in the legacy applets.

const EPSILON = .01;

class Quad {
  constructor() {
    this.leaf = true;
    this.valid = false;
    this.px = 0; this.py = 0;
    this.vertex = -1;
    this.pointCharge = 0;
    this.cx = 0; this.cy = 0;
    this.charge = 0;
    this.nodes = [null, null, null, null];
  }

  insert(x, y, v, x1, y1, x2, y2) {
    if (Number.isNaN(x) || Number.isNaN(y)) return;
    if (this.leaf) {
      if (this.valid) {
        if (Math.abs(this.px - x) + Math.abs(this.py - y) < EPSILON) {
          this.insertChild(x, y, v, x1, y1, x2, y2);
        } else {
          this.valid = false;
          this.insertChild(this.px, this.py, this.vertex, x1, y1, x2, y2);
          this.insertChild(x, y, v, x1, y1, x2, y2);
        }
      } else {
        this.px = x; this.py = y; this.valid = true; this.vertex = v;
      }
    } else {
      this.insertChild(x, y, v, x1, y1, x2, y2);
    }
  }

  insertChild(x, y, v, x1, y1, x2, y2) {
    const sx = (x1 + x2) * .5, sy = (y1 + y2) * .5;
    const right = x >= sx, bottom = y >= sy;
    const i = (bottom << 1) + right;
    this.leaf = false;
    if (!this.nodes[i]) this.nodes[i] = new Quad();
    if (right) x1 = sx; else x2 = sx;
    if (bottom) y1 = sy; else y2 = sy;
    this.nodes[i].insert(x, y, v, x1, y1, x2, y2);
  }

  accumulate(alpha, charge) {
    let cx = 0, cy = 0;
    this.charge = 0;
    if (!this.leaf) {
      for (const c of this.nodes) {
        if (!c) continue;
        c.accumulate(alpha, charge);
        this.charge += c.charge;
        cx += c.charge * c.cx;
        cy += c.charge * c.cy;
      }
    }
    if (this.valid) {
      if (!this.leaf) {
        this.px += .1 * (Math.random() - .5);
        this.py += .1 * (Math.random() - .5);
      }
      const k = alpha * charge;
      this.pointCharge = k;
      this.charge += k;
      cx += k * this.px;
      cy += k * this.py;
    }
    this.cx = this.charge ? cx / this.charge : 0;
    this.cy = this.charge ? cy / this.charge : 0;
  }

  repulse(prev, x, y, v, x1, x2, theta) {
    if (this.vertex !== v) {
      const dx = this.cx - x, dy = this.cy - y;
      const dn = 1 / Math.sqrt(dx * dx + dy * dy);
      if ((x2 - x1) * dn < theta) {
        const k = this.charge * dn * dn;
        prev.x -= dx * k;
        prev.y -= dy * k;
        return true;
      } else if (this.valid && Number.isFinite(dn)) {
        const k = this.pointCharge * dn * dn;
        prev.x -= dx * k;
        prev.y -= dy * k;
      }
    }
    return !this.charge;
  }

  visit(prev, x, y, v, x1, y1, x2, y2, theta) {
    if (this.repulse(prev, x, y, v, x1, x2, theta)) return;
    const sx = (x1 + x2) * .5, sy = (y1 + y2) * .5;
    const [a, b, c, d] = this.nodes;
    if (a) a.visit(prev, x, y, v, x1, y1, sx, sy, theta);
    if (b) b.visit(prev, x, y, v, sx, y1, x2, sy, theta);
    if (c) c.visit(prev, x, y, v, x1, sy, sx, y2, theta);
    if (d) d.visit(prev, x, y, v, sx, sy, x2, y2, theta);
  }
}

// Defaults of main_netlab.cpp.
export const NETLAB_LAYOUT = {
  distance: .04, theta: 1, charge: -.004, strength: .9, gravity: .3, friction: .2,
};

export class ForceLayout {
  // positions: array of {x, y}, updated in place. edges: [{source, target}] with 1-based IDs.
  // bothDirections: relax each edge twice, as the legacy applets did for graphs
  // stored with a link in each direction (main_netlab.cpp) but not for graphs
  // stored with one link per pair (main_exp7.cpp).
  constructor(positions, edges, params = NETLAB_LAYOUT, { bothDirections = true } = {}) {
    this.positions = positions;
    this.last = positions.map(p => ({ x: p.x, y: p.y }));
    this.alpha = .1;
    this.fixed = -1; // index of a node held in place (SetFixed in the legacy code)
    this.gravityPoint = { x: .5, y: .5 };
    Object.assign(this, params);
    this.degree = positions.map(() => 0);
    this.links = [];
    for (const { source, target } of edges) {
      const s = source - 1, t = target - 1;
      this.degree[s]++; this.degree[t]++;
      this.links.push([s, t]);
      if (bothDirections) this.links.push([t, s]);
    }
  }

  // Moves node v to (x, y) and holds it there until release().
  hold(v, x, y) {
    this.fixed = v;
    this.positions[v].x = this.last[v].x = x;
    this.positions[v].y = this.last[v].y = y;
  }

  release() { this.fixed = -1; }

  step() {
    const pos = this.positions, n = pos.length;
    if (!n) return;

    for (const [s, t] of this.links) {
      const sp = pos[s], tp = pos[t];
      let x = tp.x - sp.x, y = tp.y - sp.y;
      const l2 = x * x + y * y;
      if (l2 > 0) {
        const len = Math.sqrt(l2);
        const l = this.alpha * this.strength * (len - this.distance) / len;
        x *= l; y *= l;
        let k = this.degree[s] / (this.degree[s] + this.degree[t]);
        if (t !== this.fixed) { tp.x -= x * k; tp.y -= y * k; }
        k = 1 - k;
        if (s !== this.fixed) { sp.x += x * k; sp.y += y * k; }
      }
    }

    const g = this.alpha * this.gravity;
    if (g) {
      for (const [v, p] of pos.entries()) {
        if (v === this.fixed) continue;
        p.x += (this.gravityPoint.x - p.x) * g;
        p.y += (this.gravityPoint.y - p.y) * g;
      }
    }

    let x1 = Infinity, x2 = -Infinity, y1 = Infinity, y2 = -Infinity;
    for (const p of pos) {
      x1 = Math.min(x1, p.x); x2 = Math.max(x2, p.x);
      y1 = Math.min(y1, p.y); y2 = Math.max(y2, p.y);
    }
    if (x2 - x1 > y2 - y1) y2 = y1 + (x2 - x1); else x2 = x1 + (y2 - y1);

    const tree = new Quad();
    for (let v = 0; v < n; v++) tree.insert(pos[v].x, pos[v].y, v, x1, y1, x2, y2);
    tree.accumulate(this.alpha, this.charge);
    for (let v = 0; v < n; v++) if (v !== this.fixed) tree.visit(this.last[v], pos[v].x, pos[v].y, v, x1, y1, x2, y2, this.theta);

    for (let v = 0; v < n; v++) {
      const p = pos[v], lp = this.last[v];
      if (v === this.fixed) { lp.x = p.x; lp.y = p.y; continue; }
      p.x -= (lp.x - p.x) * this.friction;
      p.y -= (lp.y - p.y) * this.friction;
      lp.x = p.x; lp.y = p.y;
    }
  }
}

// loadNetwork(): normalize coordinates to a bounding box inflated by 5% on
// each side, with y flipped.
export function normalizeCoordinates(raw, scaling = .05) {
  if (!raw.length) return [];
  let xmin = Infinity, xmax = -Infinity, ymin = Infinity, ymax = -Infinity;
  for (const p of raw) {
    xmin = Math.min(xmin, p.x); xmax = Math.max(xmax, p.x);
    ymin = Math.min(ymin, p.y); ymax = Math.max(ymax, p.y);
  }
  let w = xmax - xmin, h = ymax - ymin;
  if (w < 1e-3) w = 1;
  if (h < 1e-3) h = 1;
  xmin -= w * scaling; xmax += w * scaling;
  ymin -= h * scaling; ymax += h * scaling;
  return raw.map(p => ({ x: (p.x - xmin) / (xmax - xmin), y: 1 - (p.y - ymin) / (ymax - ymin) }));
}

// Legacy initial placement: random integer positions in [0,256), normalized.
export function randomPositions(n) {
  return normalizeCoordinates(Array.from({ length: n }, () => ({
    x: Math.floor(Math.random() * 256), y: Math.floor(Math.random() * 256),
  })));
}
