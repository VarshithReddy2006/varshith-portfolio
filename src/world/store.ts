/**
 * World navigation state.
 *
 * A tiny external store instead of React state so the 3D scene can read the
 * current selection inside its frame loop without re-rendering the scene
 * graph. DOM components subscribe through `useWorld`.
 *
 * The URL hash is the source of truth for routes:
 *   #about, #projects, #projects/aria, #experience, #achievements, #contact
 * so back/forward, deep links and plain <a href="#about"> links all work.
 */
import { useSyncExternalStore } from 'react';
import { isLandmarkId, journey, type LandmarkId, type ProjectId } from './landmarks';
import { PATH_LENGTH, runtime } from './journey';

export type { ProjectId };
export const projectIds: ProjectId[] = ['aria', 'devtrack', 'stratify', 'phishing'];

export interface WorldState {
  active: LandmarkId;
  hovered: LandmarkId | null;
  project: ProjectId | null;
  hoveredProject: ProjectId | null;
  /** Index into `journey` while the guided tour runs. */
  tour: number | null;
  /** True after the visitor drags the camera away from its default framing. */
  panned: boolean;
  /** Whether the WebGL world is live ('3d') or the SVG world is shown. */
  mode: '3d' | 'static';
  /**
   * Arrival journey: on the central stage, walking up to Home, or arrived.
   * Landmark labels and panels belong to the arrived world.
   */
  intro: 'stage' | 'walking' | 'arrived';
  /** Walking is driven by held keys instead of the automatic journey. */
  manual: boolean;
}

let state: WorldState = {
  active: 'home',
  hovered: null,
  project: null,
  hoveredProject: null,
  tour: null,
  panned: false,
  mode: 'static',
  intro: 'stage',
  manual: false,
};

const listeners = new Set<() => void>();

export const world = {
  get: () => state,
  set(patch: Partial<WorldState>) {
    let changed = false;
    for (const k in patch) {
      if (state[k as keyof WorldState] !== patch[k as keyof WorldState]) {
        changed = true;
        break;
      }
    }
    if (!changed) return;
    state = { ...state, ...patch };
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

export function useWorld<T>(selector: (s: WorldState) => T): T {
  return useSyncExternalStore(
    world.subscribe,
    () => selector(state),
    () => selector(state),
  );
}

export const isPanelOpen = (s: WorldState) => s.active !== 'home' && s.tour === null;

export interface PanelBox {
  side: 'right' | 'bottom';
  /** Width (right) or height (bottom) in CSS px, including the outer margin. */
  size: number;
}

/** Non-reactive handles shared between the DOM overlay and the scene. */
export const registry = {
  /** Landmark label elements, positioned every frame by the active renderer. */
  labels: new Map<LandmarkId, HTMLElement>(),
  labelSizes: new Map<LandmarkId, { w: number; h: number }>(),
  /** Screen areas labels must avoid (hero intro, stats, panel, controls). */
  exclusions: new Map<string, DOMRect>(),
  /** Footprint of the open section panel; the camera frames around it. */
  panelBox: null as PanelBox | null,
  /** Element that triggered the last selection; focus returns here on close. */
  trigger: null as HTMLElement | null,
  /** Installed by the camera rig to undo a user drag. */
  resetPan: null as null | (() => void),
};

/* ------------------------------------------------------------------ */
/* Routing                                                             */
/* ------------------------------------------------------------------ */

function parseHash(hash: string): { active: LandmarkId; project: ProjectId | null } {
  const [head, sub] = decodeURIComponent(hash).replace(/^#\/?/, '').toLowerCase().split('/');
  if (head === 'skills') return { active: 'about', project: null };
  if (!head || !isLandmarkId(head)) return { active: 'home', project: null };
  const project = head === 'projects' && projectIds.includes(sub as ProjectId) ? (sub as ProjectId) : null;
  return { active: head, project };
}

export function hashFor(active: LandmarkId, project: ProjectId | null = null) {
  if (active === 'home') return '#home';
  return project && active === 'projects' ? `#projects/${project}` : `#${active}`;
}

function writeHash(active: LandmarkId, project: ProjectId | null, mode: 'push' | 'replace' | 'none') {
  if (mode === 'none') return;
  const next = active === 'home' ? '' : hashFor(active, project);
  const current = location.hash === '#home' ? '' : location.hash;
  if (current === next) return;
  const url = next || location.pathname + location.search;
  if (mode === 'push') history.pushState(null, '', url);
  else history.replaceState(null, '', url);
}

let lastInteractive: HTMLElement | null = null;

function rememberTrigger() {
  const focused = document.activeElement;
  const el =
    focused instanceof HTMLElement && focused !== document.body && !focused.closest('[data-panel]')
      ? focused
      : lastInteractive && !lastInteractive.closest('[data-panel]')
        ? lastInteractive
        : null;
  if (el) registry.trigger = el;
}

interface SelectOpts {
  project?: ProjectId | null;
  history?: 'push' | 'replace' | 'none';
  keepTour?: boolean;
}

/** The single entry point for navigating the world. */
export function select(id: LandmarkId, opts: SelectOpts = {}) {
  // Navigating anywhere but Home skips the arrival journey.
  if (state.intro !== 'arrived') {
    if (id === 'home') return;
    arrive();
  }
  if (!state.tour && state.active === 'home' && id !== 'home') rememberTrigger();
  const project = opts.project !== undefined ? opts.project : id === 'projects' && state.active === 'projects' ? state.project : null;
  world.set({ active: id, project, tour: opts.keepTour ? state.tour : null });
  writeHash(id, project, opts.history ?? (opts.keepTour ? 'replace' : 'push'));
}

export const selectProject = (project: ProjectId | null) => select('projects', { project });
export const hover = (id: LandmarkId | null) => world.set({ hovered: id });
export const hoverProject = (id: ProjectId | null) => world.set({ hoveredProject: id });

/* ------------------------------------------------------------------ */
/* Arrival journey                                                     */
/* ------------------------------------------------------------------ */

/** Start walking from the stage. Reduced motion (or no WebGL) arrives immediately. */
export function beginJourney(opts: { manual?: boolean; instant?: boolean } = {}) {
  if (state.intro === 'arrived') return;
  if (opts.instant || state.mode !== '3d') return arrive();
  runtime.autoFinish = false;
  world.set({ intro: 'walking', manual: !!opts.manual });
}

/**
 * Arrive at Home. 
atural means the walk reached the top of the stairs:
 * the character keeps walking to the gateway while the camera reveals the
 * world. Otherwise (skip) the character is placed at the gateway.
 */
export function arrive(opts: { natural?: boolean } = {}) {
  if (state.intro === 'arrived') return;
  runtime.autoFinish = !!opts.natural;
  if (!opts.natural) runtime.s = PATH_LENGTH;
  runtime.manualDir = 0;
  world.set({ intro: 'arrived', manual: false });
}

/** Switch between held-key walking and the automatic journey. */
export const setManual = (manual: boolean) => world.set({ manual });

export function startTour() {
  arrive();
  rememberTrigger();
  world.set({ tour: 0 });
  select(journey[0], { keepTour: true });
}

export function tourGo(index: number) {
  if (index < 0 || index >= journey.length) return stopTour();
  world.set({ tour: index });
  select(journey[index], { keepTour: true });
}

export function stopTour() {
  world.set({ tour: null });
  select('home', { history: 'replace' });
}

let syncing = false;
/** Reads the initial hash and keeps the store in sync with history navigation. */
export function startHashSync() {
  if (syncing) return () => {};
  syncing = true;
  const apply = () => {
    const { active, project } = parseHash(location.hash);
    if (state.active === 'home' && active !== 'home') rememberTrigger();
    // Deep links (and history navigation away from Home) skip the journey.
    if (active !== 'home') arrive();
    world.set({ active, project, tour: null });
  };
  // Remember the last clicked control (Safari does not focus links on click).
  const onClick = (e: MouseEvent) => {
    const el = (e.target as Element | null)?.closest?.('a,button');
    if (el instanceof HTMLElement) lastInteractive = el;
  };
  apply();
  window.addEventListener('hashchange', apply);
  window.addEventListener('popstate', apply);
  document.addEventListener('click', onClick, true);
  return () => {
    syncing = false;
    window.removeEventListener('hashchange', apply);
    window.removeEventListener('popstate', apply);
    document.removeEventListener('click', onClick, true);
  };
}
