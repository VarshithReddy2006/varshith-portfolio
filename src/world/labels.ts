/**
 * Screen-space layout for landmark labels, shared by the WebGL rig and the
 * static SVG world. Resolves label/label overlap and keeps labels out of
 * reserved UI areas (navigation, hero intro, stats, open panel).
 */
import { landmarks, type LandmarkDef, type LandmarkId } from './landmarks';
import { registry, world, type WorldState } from './store';

export interface LabelPoint {
  id: LandmarkId;
  x: number;
  y: number;
  /** False when the anchor is behind the camera or the label should hide. */
  ok: boolean;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlap = (a: Rect, b: Rect, pad = 6) =>
  a.x < b.x + b.w + pad && a.x + a.w + pad > b.x && a.y < b.y + b.h + pad && a.y + a.h + pad > b.y;

const GAP = 14;

/** Which labels belong on screen for the current navigation state. */
export function labelWanted(id: LandmarkId, s: WorldState) {
  if (s.tour !== null) return false;
  // The world's labels appear once the visitor has arrived.
  if (s.intro !== 'arrived') return false;
  if (s.active === 'home') return true;
  // While a panel is open, other landmarks only announce themselves on hover.
  return s.hovered === id && id !== s.active;
}

function rectFor(def: LandmarkDef, x: number, y: number, w: number, h: number): Rect {
  switch (def.label.align) {
    case 'left':
      return { x: x - w - GAP, y: y - h / 2, w, h };
    case 'right':
      return { x: x + GAP, y: y - h / 2, w, h };
    default:
      return { x: x - w / 2, y: y - h - GAP, w, h };
  }
}

const smooth = new Map<LandmarkId, { x: number; y: number; init: boolean }>();

/**
 * Positions every label element. `k` is the smoothing factor (1 = snap).
 * Writes transforms directly to the DOM; no React renders involved.
 */
export function layoutLabels(points: LabelPoint[], vw: number, vh: number, k = 1) {
  const s = world.get();
  const navH = 72;
  const placed: Rect[] = [];
  const blockers: Rect[] = [...registry.exclusions.values()].map((d) => ({ x: d.left, y: d.top, w: d.width, h: d.height }));

  // Wider landmarks claim space first; Home last so it yields to the rest.
  const order = [...points].sort((a, b) => (a.id === 'home' ? 1 : b.id === 'home' ? -1 : a.y - b.y));

  for (const p of order) {
    const el = registry.labels.get(p.id);
    if (!el) continue;
    const def = landmarks.find((l) => l.id === p.id)!;
    const size = registry.labelSizes.get(p.id) ?? { w: 180, h: 56 };
    let r = rectFor(def, p.x, p.y, size.w, size.h);
    let show = p.ok && labelWanted(p.id, s);

    if (show) {
      // Keep inside the viewport, below the navigation bar.
      r.x = Math.min(Math.max(r.x, 10), vw - r.w - 10);
      r.y = Math.min(Math.max(r.y, navH), vh - r.h - 10);
      // Offscreen anchors (e.g. far left on phones) hide instead of clamping.
      if (p.x < -40 || p.x > vw + 40 || p.y < 0 || p.y > vh + 40) show = false;
    }

    if (show) {
      // Nudge upwards out of collisions, then give up if still blocked.
      for (let tries = 0; tries < 6; tries++) {
        const hit = [...placed, ...blockers].find((o) => overlap(r, o));
        if (!hit) break;
        const up = r.y + r.h - hit.y + 8;
        const down = hit.y + hit.h - r.y + 8;
        r = { ...r, y: up < down || r.y - up > navH ? r.y - up : r.y + down };
        if (r.y < navH || r.y + r.h > vh - 8) {
          show = false;
          break;
        }
      }
      if (show && [...placed, ...blockers].some((o) => overlap(r, o, 0))) show = false;
    }

    const prev = smooth.get(p.id);
    const sx = !prev?.init || k >= 1 ? r.x : prev.x + (r.x - prev.x) * k;
    const sy = !prev?.init || k >= 1 ? r.y : prev.y + (r.y - prev.y) * k;
    smooth.set(p.id, { x: sx, y: sy, init: show || !!prev?.init });

    el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0)`;
    const vis = show ? '1' : '0';
    if (el.dataset.show !== vis) {
      el.dataset.show = vis;
      el.style.opacity = vis;
      el.style.visibility = show ? 'visible' : 'hidden';
    }
    if (show) placed.push(r);
  }
}

/** Forget smoothing (e.g. when the renderer changes). */
export const resetLabelSmoothing = () => smooth.clear();
