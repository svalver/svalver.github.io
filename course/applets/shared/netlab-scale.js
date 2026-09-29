// UI scale for the Netlab window (title-bar − / + buttons), remembered per browser.

const STEPS = [1, 1.25, 1.5, 1.75, 2];
const KEY = 'netlab-scale';
const listeners = [];

function read() {
  try { return Number(localStorage.getItem(KEY)); } catch { return NaN; }
}

let scale = STEPS.includes(read()) ? read() : 1;

export const getScale = () => scale;
export const onScale = fn => listeners.push(fn);

function apply(minus, plus) {
  document.documentElement.style.setProperty('--s', scale);
  minus.disabled = scale === STEPS[0];
  plus.disabled = scale === STEPS.at(-1);
  for (const fn of listeners) fn(scale);
}

export function initScale(minus, plus) {
  const step = delta => {
    scale = STEPS[Math.max(0, Math.min(STEPS.length - 1, STEPS.indexOf(scale) + delta))];
    try { localStorage.setItem(KEY, String(scale)); } catch {}
    apply(minus, plus);
  };
  minus.addEventListener('click', () => step(-1));
  plus.addEventListener('click', () => step(1));
  apply(minus, plus);
}
