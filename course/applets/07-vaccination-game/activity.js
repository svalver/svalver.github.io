// Port of old_applets/netfail/main_vaccine.cpp
// ("Vaccination by Sergi Valverde (@svalver) 2017-2026").
import { ForceLayout, normalizeCoordinates } from '../shared/force-layout.js?v=2e3e9bc0';
import { initScale, onScale, getScale } from '../shared/netlab-scale.js?v=2e3e9bc0';
import { NetworkView } from '../shared/netlab-ui.js?v=2e3e9bc0';
import { Epidemic, S, I, R, STEPS_PER_SECOND } from './sim.js?v=2e3e9bc0';
import { Curves } from './curves.js?v=2e3e9bc0';

const $ = id => document.getElementById(id);

// Layout defaults of main_vaccine.cpp; the layout always runs (basic_speed 75).
const params = { distance: .03, theta: 1, charge: -.002, strength: .7, gravity: .1, friction: .1 };
const COLORS = {
  [S]: 'rgb(102,102,153)', [I]: 'rgb(255,26,26)', [R]: 'rgb(51,51,255)', hover: 'rgb(255,255,255)',
};
const CITIES = ['town', 'communities', 'slum'];
const curves = new Curves($('curves'));

// A syringe in pixel art (32 x 16): needle, barrel with its dose, plunger.
const SYRINGE = `<svg viewBox="0 0 32 16" xmlns="http://www.w3.org/2000/svg">
  <rect x="0" y="7" width="6" height="2" fill="rgb(230,230,230)"/>
  <rect x="6" y="5" width="2" height="6" fill="rgb(230,230,230)"/>
  <rect x="8" y="3" width="15" height="10" fill="rgb(230,230,230)"/>
  <rect class="fill" x="9" y="4" width="13" height="8" fill="rgb(90,120,255)"/>
  <rect x="12" y="4" width="1" height="3" fill="rgb(230,230,230)"/><rect x="16" y="4" width="1" height="3" fill="rgb(230,230,230)"/>
  <rect x="23" y="7" width="5" height="2" fill="rgb(230,230,230)"/>
  <rect x="28" y="2" width="3" height="12" fill="rgb(230,230,230)"/>
</svg>`;

function renderVaccines(total, left) {
  const icons = $('vaccine-icons');
  if (icons.children.length !== total) {
    icons.innerHTML = SYRINGE.repeat(total);
  }
  [...icons.children].forEach((svg, i) => {
    const used = i >= left;
    if (used && !svg.classList.contains('used')) {       // a vaccine was just used: pop it
      svg.classList.add('popping');
      setTimeout(() => svg.classList.remove('popping'), 200);
    }
    svg.classList.toggle('used', used);
  });
}

const view = new NetworkView($('canvas'), { pad: 8, draggable: false });
view.speed = 75;
view.nodeColor = i => (i === hover ? COLORS.hover : COLORS[epidemic.state[i]]);
// radius = 5 + 2 * (outdegree / max_outdegree), with the legacy integer
// division: nodes with the maximum degree are drawn larger.
view.radiusOf = i => 5 + 2 * Math.floor(epidemic.adj[i].size / Math.max(1, maxDegree));

let cities, city, cityKey, epidemic, maxDegree = 1, hover = -1;
let phase = 'select';            // select | vaccinate | epidemic | gameover
let vaccines = 0, game = null;   // game: what is sent to the class board
let started = 0;                 // time the epidemic started (ms)
let classMode = false;

// --- Network and layout ----------------------------------------------------

function relayout() {
  maxDegree = Math.max(1, ...epidemic.adj.map(a => a.size));
  const k = epidemic.adj.map(a => a.size);
  view.set({ n: epidemic.n, edges: epidemic.edges.map(([a, b]) => ({ source: a + 1, target: b + 1 })) },
    view.positions, k, new ForceLayout(view.positions, epidemic.edges.map(([a, b]) => ({ source: a + 1, target: b + 1 })), params));
}

function load(key, seed, pInfect) {
  const c = cities[key];
  epidemic = new Epidemic(c.positions.length, c.edges, seed, pInfect);
  view.positions = normalizeCoordinates(c.positions.map(([x, y]) => ({ x, y })));
  relayout();
}

// --- Start screen: the background epidemic ----------------------------------

function showSelect() {
  phase = 'select';
  load('background', Math.floor(Math.random() * 2 ** 32), .01);
  epidemic.start();
  started = performance.now();
  $('line1').textContent = '';
  $('vaccine-icons').replaceChildren();
  $('counts').hidden = true;
  $('curves').hidden = true;
  $('gameover').hidden = true;
  $('select').hidden = false;
  renderScores();
}

// --- Game ------------------------------------------------------------------

function play(key) {
  cityKey = key;
  city = cities[key];
  const seed = Math.floor(Math.random() * 2 ** 32);
  load(key, seed);
  vaccines = city.vaccines;
  game = { city: key, seed, vaccinated: [], quarantined: [] };
  phase = 'vaccinate';
  $('counts').hidden = true;
  $('curves').hidden = true;
  $('select').hidden = true;
  status();
}

function status() {
  if (phase === 'vaccinate') {
    $('line1').textContent = `You have ${vaccines} vaccines left.`;
    renderVaccines(city.vaccines, vaccines);
  } else if (phase === 'epidemic' || phase === 'gameover') {
    const c = epidemic.counts();
    if (phase === 'epidemic') $('line1').textContent = 'Left-click to quarantine susceptible nodes.';
    $('vaccine-icons').replaceChildren();
    $('counts').hidden = false;
    $('n-healthy').textContent = c.healthy;
    $('n-infected').textContent = c.infected;
    $('n-vaccinated').textContent = c.vaccinated;
  }
}

// The closest susceptible node within reach (0.03 of the view to vaccinate,
// 0.05 to quarantine, as in the legacy game).
function closest(event) {
  const w = $('canvas').clientWidth, h = $('canvas').clientHeight;
  const reach = (phase === 'vaccinate' ? .03 : .05) * Math.min(w, h) / getScale();
  return view.nodeAt(event, { reach, accept: i => epidemic.state[i] === S }).node;
}

$('canvas').addEventListener('pointermove', event => {
  const next = phase === 'vaccinate' || phase === 'epidemic' ? closest(event) : -1;
  if (next !== hover) { hover = next; view.dirty = true; }
});
$('canvas').addEventListener('pointerleave', () => { hover = -1; view.dirty = true; });

$('canvas').addEventListener('pointerdown', event => {
  if (event.button !== 0 || (phase !== 'vaccinate' && phase !== 'epidemic')) return;
  const i = closest(event);
  if (i < 0 || !epidemic.isolate(i)) return;
  view.pulse(i, phase === 'vaccinate' ? 'vaccine' : 'quarantine');
  if (phase === 'vaccinate') {
    game.vaccinated.push(i);
    vaccines--;
    if (vaccines === 0) {
      renderVaccines(city.vaccines, 0);
      epidemic.start();
      curves.reset(epidemic.n);
      curves.push(epidemic.counts());
      $('curves').hidden = false;
      for (let j = 0; j < epidemic.n; j++) if (epidemic.state[j] === I) view.pulse(j, 'infection');
      started = performance.now();
      phase = 'epidemic';
    }
  } else {
    game.quarantined.push([epidemic.steps, i]);
    curves.points[curves.points.length - 1] = epidemic.counts();   // the quarantine shows at once
  }
  relayout();
  hover = closest(event);
  status();
});

// Epidemic steps at a fixed rate, whatever the screen refresh rate.
function tick(now) {
  if (phase === 'epidemic' || phase === 'select') {
    const due = Math.floor((now - started) * STEPS_PER_SECOND / 1000);
    let budget = 10;
    while (epidemic.steps < due && budget--) {
      const before = epidemic.state.slice();
      epidemic.step();
      if (phase === 'epidemic') {
        for (let i = 0; i < epidemic.n; i++) if (before[i] !== I && epidemic.state[i] === I) view.pulse(i, 'infection');
        curves.push(epidemic.counts());
      }
      if (epidemic.exhausted()) {
        if (phase === 'select') {            // background: start again
          for (let i = 0; i < epidemic.n; i++) epidemic.state[i] = S;
          epidemic.start();
          started = now;
          epidemic.steps = 0;
        } else {
          gameOver();
        }
        break;
      }
    }
    if (budget < 0) started = now - epidemic.steps * 1000 / STEPS_PER_SECOND; // fell behind: do not rush
    view.dirty = true;
    status();
    if (phase !== 'select') curves.draw();
  }
  requestAnimationFrame(tick);
}

// --- High scores (per browser; the class board in class mode) ---------------

const SCORES_KEY = 'netlab-vaccine-scores';
// Default entries: one pioneer per city (the 2017 game used "JOHNNY.").
const DEFAULT_NAMES = { town: 'ERDÖS', communities: 'PRICE', slum: 'LEWONTIN' };
const defaultTable = city => Array.from({ length: 10 }, () => ({ name: DEFAULT_NAMES[city], score: 0 }));

function localScores() {
  try {
    const saved = JSON.parse(localStorage.getItem(SCORES_KEY));
    if (saved && CITIES.every(c => Array.isArray(saved[c]))) {
      for (const c of CITIES) for (const e of saved[c]) if (e.name === 'JOHNNY.' && !e.score) e.name = DEFAULT_NAMES[c];
      return saved;
    }
  } catch {}
  return Object.fromEntries(CITIES.map(c => [c, defaultTable(c)]));
}

let classScores = null;

async function renderScores() {
  if (classMode) {
    try { classScores = await (await fetch('/api/07/top')).json(); } catch {}
  }
  const tables = classMode && classScores
    ? Object.fromEntries(CITIES.map(c => [c, (classScores[c] || []).map(r => ({ name: r.nick, score: r.score }))]))
    : localScores();
  $('score-rows').replaceChildren(...Array.from({ length: 10 }, (_, i) => {
    const tr = document.createElement('tr');
    for (const c of CITIES) {
      const td = document.createElement('td');
      const e = tables[c][i];
      td.textContent = e ? `${e.name} ${e.score}` : '';
      tr.append(td);
    }
    return tr;
  }));
}

// --- Game over ---------------------------------------------------------------

let record = -1;   // position of the new high score in the local table, or -1

function gameOver() {
  phase = 'gameover';
  status();
  curves.draw();
  const c = epidemic.counts();
  const pInfected = c.infected / epidemic.n;
  game.score = epidemic.n - c.infected;
  $('verdict').textContent = pInfected < .08 ? 'You have survived'
    : pInfected < .25 ? 'The outbreak has finished' : 'You are dead!';
  $('infected-line').textContent = `   Infected = ${Math.floor(100 * pInfected)} %`;
  const table = localScores()[cityKey];
  record = table.findIndex(e => !(e.score > game.score));   // std::lower_bound with score >
  $('record').hidden = record < 0 || record >= 10;
  $('name-row').hidden = $('record').hidden && !classMode;
  try { $('name').value = localStorage.getItem('netlab-nick') || ''; } catch {}
  $('send-status').textContent = classMode ? 'Enter a name to send your score to the class board.' : '';
  $('send-status').classList.remove('error');
  $('ok').disabled = false;
  $('gameover').hidden = false;
  if (!$('name-row').hidden) $('name').focus();
}

$('name').addEventListener('input', () => {
  $('name').value = $('name').value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
});

$('gameover-form').addEventListener('submit', async event => {
  event.preventDefault();
  const name = $('name').value;
  if (name) { try { localStorage.setItem('netlab-nick', name); } catch {} }

  if (record >= 0 && record < 10) {
    const scores = localScores();
    scores[cityKey].splice(record, 0, { name: name || '.......', score: game.score });
    scores[cityKey] = scores[cityKey].slice(0, 10);
    try { localStorage.setItem(SCORES_KEY, JSON.stringify(scores)); } catch {}
  }

  if (classMode && name) {
    $('ok').disabled = true;
    $('send-status').textContent = 'Sending...';
    try {
      const response = await fetch('/api/07/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nick: name, ...game }),
      });
      const reply = await response.json();
      if (!response.ok) throw new Error(reply.error || 'Not sent');
    } catch (err) {
      $('send-status').textContent = err.message === 'Failed to fetch' ? 'Not sent: no connection' : err.message;
      $('send-status').classList.add('error');
      $('ok').disabled = false;
      return;
    }
  }
  showSelect();
});

// --- Start -------------------------------------------------------------------

for (const b of document.querySelectorAll('[data-city]')) b.addEventListener('click', () => play(b.dataset.city));

initScale($('scale-down'), $('scale-up'));
onScale(() => { view.dirty = true; });

fetch('/api/info').then(r => r.ok ? r.json() : null).then(info => {
  classMode = Boolean(info?.class);
  renderScores();
}).catch(() => {});

cities = await (await fetch('cities.json?v=2e3e9bc0')).json();
showSelect();
requestAnimationFrame(tick);
