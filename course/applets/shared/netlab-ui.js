// Widgets shared by the Netlab applets: the network view, ImGui-style plots,
// the Speed slider and the layout inputs.
import { getScale } from './netlab-scale.js?v=ee62343c';

// --- Network view ------------------------------------------------------------

// Selected nodes and paths (col_nodes_off of main_exp2.cpp).
const HIGHLIGHT = 'rgb(255,255,26)';

// Rings for the epidemic game (pulse).
const PULSES = {
  vaccine: { color: '120,150,255', width: 3, grow: 26, duration: 650, dash: false },
  quarantine: { color: '120,150,255', width: 2, grow: 20, duration: 650, dash: true },
  infection: { color: '255,70,50', width: 2, grow: 10, duration: 350, dash: false },
};

// Flash colours (core, middle, edge of the glow) for removed nodes.
const FLASH_COLORS = {
  failure: ['255,255,255', '230,240,255', '200,220,255'],
  attack: ['255,240,200', '255,130,60', '255,60,30'],
};

// Draws nodes and links on a canvas, lets nodes be dragged, and runs the layout
// at the legacy speed: floor(exp(0.2 * speed / 10)) steps per frame.
export class NetworkView {
  // sizeByDegree: node radius 4 + 2.5 ln(k) instead of a fixed 4 px, so hubs stand out.
  // draggable: false when clicks on nodes do something else (picking endpoints).
  constructor(canvas, { pad = 8, node = 'rgb(179,179,255)', nodeOff = node, edge = 'rgb(179,179,179)', sizeByDegree = false, draggable = true } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.pad = pad; // ImGui WindowPadding of the child that holds the view
    this.colors = { node, nodeOff, edge };
    this.sizeByDegree = sizeByDegree;
    this.draggable = draggable;
    this.overlay = null;    // optional (ctx, s) => void, drawn under the network
    this.graph = { n: 0, edges: [] };
    this.positions = [];
    this.degrees = [];
    this.layout = null;
    this.speed = 0;
    this.dirty = true;
    this.dragging = -1;
    this.beforeStep = null; // called before every layout step (growth models)
    this.flashes = [];      // { node, start } for nodes just removed
    this.highlight = null;  // selected nodes and paths, drawn in yellow (see draw)
    this.nodeColor = null;  // optional i => CSS colour, overriding the node colour
    this.radiusOf = null;   // optional i => radius in unscaled px, overriding the default
    this.nodeInfo = null;   // optional i => extra tooltip text
    this.ghosts = [];       // { path, start }: routes or links that just broke, fading in red
    this.snaps = [];        // { a, b, start }: links that just failed (snapLink)
    this.pulses = [];       // { node, start, kind }: rings (pulse)
    new ResizeObserver(() => { this.dirty = true; }).observe(canvas);
    this.bindDragging();
    const frame = () => { this.frame(); requestAnimationFrame(frame); };
    requestAnimationFrame(frame);
  }

  // keepDrag: a node being dragged stays held by the new layout.
  set(graph, positions, degrees, layout, { keepDrag = false } = {}) {
    const held = keepDrag && this.dragging >= 0 && this.dragging < graph.n ? this.dragging : -1;
    Object.assign(this, { graph, positions, degrees, layout, dragging: held });
    if (held >= 0) layout.hold(held, positions[held].x, positions[held].y);
    this.canvas.setAttribute('aria-label', `Network view: ${graph.n} nodes, ${graph.edges.length} links`);
    this.dirty = true;
  }

  // Node radius in unscaled pixels.
  radius(i) {
    if (this.radiusOf) return this.radiusOf(i);
    const k = this.degrees[i] || 0;
    return this.sizeByDegree && k > 1 ? 4 + 2.5 * Math.log(k) : 4;
  }

  toScreen(p) {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight, m = this.pad * getScale();
    return { x: m + (w - 2 * m) * p.x, y: m + (h - 2 * m) * p.y };
  }

  fromScreen(x, y) {
    const w = this.canvas.clientWidth, h = this.canvas.clientHeight, m = this.pad * getScale();
    return { x: (x - m) / (w - 2 * m), y: (y - m) / (h - 2 * m) };
  }

  frame() {
    if (this.layout && this.speed > 0 && this.graph.n) {
      const runs = Math.floor(Math.exp(.2 * (this.speed / 10)));
      for (let r = 0; r < runs; r++) {
        this.beforeStep?.();
        this.layout.step();
      }
      this.dirty = true;
    }
    if (this.flashes.length || this.ghosts.length || this.snaps.length || this.pulses.length) this.dirty = true;
    if (this.dirty) { this.draw(); this.dirty = false; }
  }

  // A short flash over node i (0-based) when it is removed: white-blue for a
  // random failure, red-orange for a targeted attack.
  flash(i, kind = 'failure') {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    this.flashes.push({ node: i, start: performance.now(), kind });
    this.dirty = true;
  }

  // An expanding ring around node i (0-based). Kinds (colour, line, size,
  // duration): 'vaccine' a solid blue shield, 'quarantine' a dashed blue
  // cordon, 'infection' a small, quick red pulse.
  pulse(i, kind) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    this.pulses.push({ node: i, start: performance.now(), kind });
    this.dirty = true;
  }

  drawPulses(ctx, s) {
    const now = performance.now();
    this.pulses = this.pulses.filter(p => now - p.start < PULSES[p.kind].duration && p.node < this.graph.n);
    ctx.save();
    for (const p of this.pulses) {
      const style = PULSES[p.kind];
      const t = (now - p.start) / style.duration;          // 0 → 1
      const c = this.toScreen(this.positions[p.node]);
      ctx.strokeStyle = `rgba(${style.color},${1 - t})`;
      ctx.lineWidth = style.width * s;
      ctx.setLineDash(style.dash ? [4 * s, 3 * s] : []);
      ctx.beginPath();
      ctx.arc(c.x, c.y, (6 + style.grow * Math.sqrt(t)) * s, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }

  // A link between nodes i and j (0-based) that fails: it snaps at the
  // middle, with a spark, and the two halves retract to their endpoints.
  snapLink(i, j) {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    this.snaps.push({ a: i, b: j, start: performance.now() });
    this.dirty = true;
  }

  drawSnaps(ctx, s) {
    const now = performance.now(), duration = 450;
    this.snaps = this.snaps.filter(f => now - f.start < duration);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    for (const f of this.snaps) {
      const t = (now - f.start) / duration;           // 0 → 1
      const keep = 1 - Math.sqrt(t);                  // halves retract quickly, then slow down
      const alpha = 1 - t;
      const a = this.toScreen(this.positions[f.a]), b = this.toScreen(this.positions[f.b]);
      const m = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const half = (p) => ({ x: p.x + (m.x - p.x) * keep, y: p.y + (m.y - p.y) * keep });
      const ha = half(a), hb = half(b);
      for (const [width, color] of [[6, `rgba(200,220,255,${.35 * alpha})`], [2, `rgba(255,255,255,${alpha})`]]) {
        ctx.strokeStyle = color;
        ctx.lineWidth = width * s;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(ha.x, ha.y);
        ctx.moveTo(b.x, b.y); ctx.lineTo(hb.x, hb.y);
        ctx.stroke();
      }
      if (t < .5) {                                    // spark at the break
        const u = t / .5, r = (4 + 16 * Math.sqrt(u)) * s, a2 = 1 - u;
        const spark = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, r);
        spark.addColorStop(0, `rgba(255,255,255,${a2})`);
        spark.addColorStop(.4, `rgba(230,240,255,${.7 * a2})`);
        spark.addColorStop(1, 'rgba(200,220,255,0)');
        ctx.fillStyle = spark;
        ctx.beginPath();
        ctx.arc(m.x, m.y, r, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // Shows a route that just broke in red, fading out ("recalculating route").
  showGhost(path) {
    if (!path || path.length < 2) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    this.ghosts.push({ path, start: performance.now() });
    this.dirty = true;
  }

  drawGhosts(ctx, s) {
    const now = performance.now();
    this.ghosts = this.ghosts.filter(g => now - g.start < 900);
    ctx.lineWidth = 3 * s;
    ctx.setLineDash([6 * s, 4 * s]);
    for (const g of this.ghosts) {
      ctx.strokeStyle = `rgba(255,60,30,${1 - (now - g.start) / 900})`;
      ctx.beginPath();
      g.path.forEach((i, step) => {
        const p = this.toScreen(this.positions[i]);
        if (step) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y);
      });
      ctx.stroke();
    }
    ctx.setLineDash([]);
  }

  drawFlashes(ctx, s) {
    const now = performance.now(), duration = 400;
    this.flashes = this.flashes.filter(f => now - f.start < duration && f.node < this.graph.n);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of this.flashes) {
      const t = (now - f.start) / duration;           // 0 → 1
      const p = this.toScreen(this.positions[f.node]);
      const r = (8 + 44 * Math.sqrt(t)) * s;          // bloom grows quickly, then slows
      const a = 1 - t * t;                            // stays bright, then fades out
      const [core, mid, edge] = FLASH_COLORS[f.kind] || FLASH_COLORS.failure;
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      glow.addColorStop(0, `rgba(${core},${a})`);
      glow.addColorStop(.3, `rgba(${core},${a})`);
      glow.addColorStop(.55, `rgba(${mid},${.55 * a})`);
      glow.addColorStop(1, `rgba(${edge},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  }

  draw() {
    const { canvas, ctx, graph, positions, degrees, colors } = this;
    const dpr = window.devicePixelRatio || 1, s = getScale();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    this.overlay?.(ctx, s);

    ctx.strokeStyle = colors.edge;
    ctx.lineWidth = s;
    ctx.beginPath();
    for (const { source: a, target: b } of graph.edges) {
      const p = this.toScreen(positions[a - 1]), q = this.toScreen(positions[b - 1]);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
    }
    ctx.stroke();

    // Directed graphs ({ directed: true }): an arrowhead at the target of each link.
    if (graph.directed) {
      ctx.fillStyle = colors.edge;
      ctx.beginPath();
      for (const { source: a, target: b } of graph.edges) {
        const p = this.toScreen(positions[a - 1]), q = this.toScreen(positions[b - 1]);
        const dx = q.x - p.x, dy = q.y - p.y, len = Math.hypot(dx, dy);
        const r = this.radius(b - 1) * s;
        if (len <= r + 6 * s) continue;
        const ux = dx / len, uy = dy / len;
        const tip = { x: q.x - ux * r, y: q.y - uy * r };
        const base = { x: tip.x - ux * 6 * s, y: tip.y - uy * 6 * s };
        ctx.moveTo(tip.x, tip.y);
        ctx.lineTo(base.x - uy * 2.5 * s, base.y + ux * 2.5 * s);
        ctx.lineTo(base.x + uy * 2.5 * s, base.y - ux * 2.5 * s);
        ctx.closePath();
      }
      ctx.fill();
    }

    // Highlight: { nodes: [i], labels: ['A', 'B'], path: [i, …], links: [[i, j]], strong: [[i, j]] }.
    // links (faint) are all the shortest paths; path (bright) is one of them.
    const hl = this.highlight;
    const line = (a, b) => {
      const p = this.toScreen(positions[a]), q = this.toScreen(positions[b]);
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(q.x, q.y);
    };
    if (hl?.links?.length) {
      ctx.strokeStyle = 'rgba(255,255,26,.35)';
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      for (const [a, b] of hl.links) line(a, b);
      ctx.stroke();
    }
    if (hl?.strong?.length) {           // e.g. shortcuts: solid yellow, 2 px
      ctx.strokeStyle = HIGHLIGHT;
      ctx.lineWidth = 2 * s;
      ctx.beginPath();
      for (const [a, b] of hl.strong) line(a, b);
      ctx.stroke();
    }
    if (this.ghosts.length) this.drawGhosts(ctx, s);
    if (hl?.path?.length > 1) {
      ctx.strokeStyle = HIGHLIGHT;
      ctx.lineWidth = 3 * s;
      ctx.beginPath();
      for (let step = 1; step < hl.path.length; step++) line(hl.path[step - 1], hl.path[step]);
      ctx.stroke();
    }
    const marked = new Set(hl?.nodes || []);

    // Larger nodes first, so small nodes drawn over a hub stay visible;
    // selected nodes last, on top.
    const order = Array.from({ length: graph.n }, (_, i) => i);
    if (this.sizeByDegree) order.sort((a, b) => this.radius(b) - this.radius(a));
    if (marked.size) order.sort((a, b) => marked.has(a) - marked.has(b));
    for (const i of order) {
      const p = this.toScreen(positions[i]);
      ctx.fillStyle = marked.has(i) ? HIGHLIGHT
        : this.nodeColor?.(i) ?? (degrees[i] > 0 ? colors.node : colors.nodeOff);
      ctx.beginPath();
      ctx.arc(p.x, p.y, (marked.has(i) ? Math.max(9, this.radius(i)) : this.radius(i)) * s, 0, 2 * Math.PI);
      ctx.fill();
    }
    // Labels on selected nodes (A and B), like map pins.
    if (hl?.labels) {
      ctx.fillStyle = 'rgb(0,0,0)';
      ctx.font = `${16 * s}px ProggyClean, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      hl.nodes.forEach((i, j) => {
        if (!hl.labels[j]) return;
        const p = this.toScreen(positions[i]);
        ctx.fillText(hl.labels[j], p.x + .5 * s, p.y + 4 * s); // capitals are 8 px tall
      });
    }
    if (this.pulses.length) this.drawPulses(ctx, s);
    if (this.snaps.length) this.drawSnaps(ctx, s);
    if (this.flashes.length) this.drawFlashes(ctx, s);
  }

  // Nearest node within reach of the pointer; accept(i) can exclude nodes.
  nodeAt(event, { reach = 8, accept = () => true } = {}) {
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left, y = event.clientY - rect.top;
    const s = getScale();
    let best = -1, bestScore = Infinity;
    for (let i = 0; i < this.graph.n; i++) {
      if (!accept(i)) continue;
      const p = this.toScreen(this.positions[i]);
      const r = Math.max(reach, this.radius(i)) * s;  // large nodes can be picked anywhere on them
      const d = Math.hypot(p.x - x, p.y - y);
      if (d <= r && d - r < bestScore) { best = i; bestScore = d - r; }
    }
    return { node: best, x, y };
  }

  // Tooltip over a node: its ID (1-based, as in the edge list) and degree.
  showNode(i, event) {
    const tip = sharedTooltip();
    if (i < 0) { tip.hidden = true; return; }
    const extra = this.nodeInfo?.(i);
    tip.textContent = `node ${i + 1}: k = ${this.degrees[i] ?? 0}${extra ? `, ${extra}` : ''}`;
    tip.style.left = `${event.clientX + 16}px`;
    tip.style.top = `${event.clientY + 8}px`;
    tip.hidden = false;
  }

  bindDragging() {
    const canvas = this.canvas;
    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || !this.layout || !this.draggable) return;
      const hit = this.nodeAt(event);
      if (hit.node < 0) return;
      this.dragging = hit.node;
      this.showNode(-1);
      canvas.setPointerCapture(event.pointerId);
      canvas.classList.add('dragging');
      const p = this.fromScreen(hit.x, hit.y);
      this.layout.hold(this.dragging, p.x, p.y);
      this.dirty = true;
    });
    canvas.addEventListener('pointermove', event => {
      const hit = this.nodeAt(event);
      if (this.dragging >= 0) {
        const p = this.fromScreen(hit.x, hit.y);
        this.layout.hold(this.dragging, p.x, p.y);
        this.dirty = true;
      } else {
        canvas.classList.toggle('over-node', hit.node >= 0);
        this.showNode(hit.node, event);
      }
    });
    canvas.addEventListener('pointerleave', () => this.showNode(-1));
    const end = () => {
      if (this.dragging < 0) return;
      this.dragging = -1;
      this.layout?.release();
      canvas.classList.remove('dragging');
    };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
  }
}

// --- Plots -----------------------------------------------------------------

// printf("%.4g")
export const formatG = v => Number.isFinite(v) ? String(Number(v.toPrecision(4))) : 'inf';

let tooltip = null;
function sharedTooltip() {
  if (!tooltip) {
    tooltip = document.createElement('div');
    tooltip.className = 'nl-tooltip';
    tooltip.hidden = true;
    document.body.append(tooltip);
  }
  return tooltip;
}

// ImGui::PlotHistogram: one bar per value, scaled to [0, max], "i: value" on hover.
export class Histogram {
  constructor(el, name) {
    this.el = el;
    this.name = name;
    this.values = [];
    el.setAttribute('role', 'img');
    el.addEventListener('pointermove', event => this.hover(event));
    el.addEventListener('pointerleave', () => {
      sharedTooltip().hidden = true;
      for (const bar of el.children) bar.classList.remove('hover');
    });
    this.set([]);
  }

  // kinds (optional): a class per bar, e.g. 'failure' or 'attack'.
  set(values, max = Math.max(0, ...values), kinds = []) {
    this.values = values;
    this.el.replaceChildren(...values.map((v, i) => {
      const bar = document.createElement('i');
      if (kinds[i]) bar.className = kinds[i];
      bar.style.height = max ? `${Math.min(1, v / max) * 100}%` : '0';
      return bar;
    }));
    this.el.setAttribute('aria-label', values.length
      ? `${this.name}: ${values.map((v, i) => `${i}: ${formatG(v)}`).join(', ')}`
      : `${this.name}: empty`);
  }

  hover(event) {
    const bars = [...this.el.children];
    if (!bars.length) return;
    const rect = this.el.getBoundingClientRect();
    const inset = 4 * getScale();
    const i = Math.max(0, Math.min(bars.length - 1,
      Math.floor((event.clientX - rect.left - inset) / (rect.width - 2 * inset) * bars.length)));
    bars.forEach((bar, j) => bar.classList.toggle('hover', j === i));
    const tip = sharedTooltip();
    tip.textContent = `${i}: ${formatG(this.values[i])}`;
    tip.style.left = `${event.clientX + 16}px`;
    tip.style.top = `${event.clientY + 8}px`;
    tip.hidden = false;
  }
}

// --- Inputs ----------------------------------------------------------------

export function bindSpeed(input, output, view) {
  input.addEventListener('input', () => {
    view.speed = Number(input.value);
    output.textContent = view.speed.toFixed(0);
  });
}

// ImGui::InputFloat: shows "%f", applies valid values as they are typed.
export function bindFloat(input, get, set) {
  input.value = get().toFixed(6);
  input.addEventListener('input', () => {
    const value = Number(input.value);
    if (input.value.trim() !== '' && Number.isFinite(value)) set(value);
  });
  input.addEventListener('change', () => { input.value = get().toFixed(6); });
}

// Inputs with data-param="distance" etc. edit the shared layout parameters.
export function bindLayoutParams(root, params, view) {
  for (const input of root.querySelectorAll('[data-param]')) {
    const name = input.dataset.param;
    bindFloat(input, () => params[name], value => {
      params[name] = value;
      if (view.layout) view.layout[name] = value;
    });
  }
}

// A button that copies a tab-separated table: header plus rows of values.
export function bindCopy(button, table) {
  const label = button.textContent;
  button.addEventListener('click', async () => {
    const { header, rows } = table();
    const text = [header, ...rows].map(row => row.join('\t')).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      button.textContent = 'Copied';
    } catch {
      button.textContent = 'Copy failed';
    }
    setTimeout(() => { button.textContent = label; }, 1500);
  });
}

// The GCC curve as a table: removals, f = removals / N, Fraction GCC, and
// which removal produced each row (failure or attack; empty for the start).
export const gccTable = (history, n, kinds = []) => ({
  header: ['removed', 'f', 'gcc', 'removal'],
  rows: history.map((gcc, r) => [r, (r / n).toFixed(4), gcc.toFixed(4), kinds[r] || '']),
});
