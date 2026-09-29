// Inset plot of the epidemic: H(t) healthy, I(t) infected, V(t) vaccinated
// (and quarantined), one point per step, drawn like an ImGui child window.
import { getScale } from '../shared/netlab-scale.js?v=ee62343c';

export const CURVE_COLORS = {
  healthy: 'rgb(150,150,215)',   // brighter than the node colour, to read on the dark frame
  infected: 'rgb(255,60,50)',
  vaccinated: 'rgb(90,120,255)',
};

export class Curves {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.n = 1;
    this.points = [];
  }

  reset(n) { this.n = n; this.points = []; this.draw(); }

  push(counts) { this.points.push(counts); }

  draw() {
    const { canvas, ctx, points, n } = this;
    const dpr = window.devicePixelRatio || 1, s = getScale();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const pad = 6 * s, left = pad, right = w - pad, top = pad, bottom = h - 16 * s;
    // axes: t from 0 to the current step (at least 5 s), 0 to N nodes
    const steps = Math.max(300, points.length - 1);
    const X = t => left + (right - left) * t / steps;
    const Y = v => bottom - (bottom - top) * v / n;
    ctx.strokeStyle = 'rgba(255,255,255,.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const f of [.25, .5, .75]) { ctx.moveTo(left, Y(f * n)); ctx.lineTo(right, Y(f * n)); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(179,179,179,.65)';
    ctx.strokeRect(left, top, right - left, bottom - top);

    ctx.lineWidth = 2 * s;
    ctx.lineJoin = 'round';
    for (const key of ['healthy', 'vaccinated', 'infected']) {
      if (!points.length) break;
      ctx.strokeStyle = CURVE_COLORS[key];
      ctx.beginPath();
      points.forEach((p, t) => { if (t) ctx.lineTo(X(t), Y(p[key])); else ctx.moveTo(X(t), Y(p[key])); });
      ctx.stroke();
    }

    ctx.fillStyle = 'rgb(230,230,230)';
    ctx.font = `${16 * s}px ProggyClean, monospace`;
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';
    ctx.fillText('t', left, h - 3 * s);
    ctx.textAlign = 'right';
    ctx.fillText(`${(points.length / 60).toFixed(1)} s`, right, h - 3 * s);
  }
}
