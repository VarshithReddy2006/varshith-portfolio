/**
 * The six landmarks of the world. Pure data (no Three.js) so the DOM overlay,
 * the WebGL scene and the static SVG world all share one definition.
 * Section content lives in src/data/content.ts; this file only places things.
 */
import type { Project } from '../data/content';

export type LandmarkId = 'home' | 'about' | 'projects' | 'experience' | 'achievements' | 'contact';
export type ProjectId = Project['id'];
export type V3 = [number, number, number];
export type LandmarkIcon = 'home' | 'user' | 'box' | 'briefcase' | 'trophy' | 'mail';

export interface IslandCfg {
  /** Island top-centre in world units. */
  pos: V3;
  r: number;
  depth: number;
  seed: number;
  /** Generic city density. */
  density: number;
  bob: number;
}

export interface LandmarkDef {
  id: LandmarkId;
  index: string;
  title: string;
  /** In-world name of the building. */
  place: string;
  subtitle: string;
  icon: LandmarkIcon;
  island: IslandCfg;
  /** Radius kept free of generic city buildings around the landmark. */
  clear: number;
  /** Half-width of a building-free corridor toward +z (where the stairs arrive). */
  corridor?: number;
  /** Height of the landmark building above the island top. */
  height: number;
  /** Label anchor relative to the island top-centre, and where the card sits. */
  label: { at: V3; align: 'top' | 'left' | 'right' };
  /** Camera viewpoint used when the landmark is selected. */
  view: { dist: number; lift: number; targetLift: number; yaw: number };
  /** Caption used by the guided tour. */
  tour: string;
}

export const landmarks: LandmarkDef[] = [
  {
    id: 'home',
    index: '01',
    title: 'Home',
    place: 'Central Portal',
    subtitle: 'Welcome to my world',
    icon: 'home',
    // No bob: the staircase is physically attached to this island.
    island: { pos: [0, -1, -6], r: 6.2, depth: 8, seed: 11, density: 3, bob: 0 },
    clear: 3.6,
    corridor: 2.4,
    height: 16.5,
    label: { at: [0, 17.4, -0.8], align: 'top' },
    view: { dist: 0, lift: 0, targetLift: 0, yaw: 0 },
    tour: 'The Central Portal. Every path in this world starts here.',
  },
  {
    id: 'about',
    index: '02',
    title: 'About',
    place: 'Knowledge Tower',
    subtitle: 'My journey, education, skills and interests',
    icon: 'user',
    island: { pos: [-20, 7.5, -30], r: 4.2, depth: 4.8, seed: 23, density: 2.2, bob: 0.22 },
    clear: 2.8,
    height: 16.5,
    label: { at: [1.6, 6.6, 0], align: 'right' },
    view: { dist: 23, lift: 2.2, targetLift: 5.2, yaw: 0.3 },
    tour: 'The Knowledge Tower. B.Tech CSE at CVR College of Engineering, Hyderabad, with a CGPA of 8.49/10.',
  },
  {
    id: 'projects',
    index: '03',
    title: 'Projects',
    place: 'Engineering District',
    subtitle: 'Real products, real impact',
    icon: 'box',
    island: { pos: [13, 6.5, -30], r: 5, depth: 6, seed: 41, density: 1.6, bob: 0.24 },
    clear: 3.7,
    height: 9.4,
    label: { at: [-0.2, 10.6, -1.7], align: 'top' },
    view: { dist: 22, lift: 2.8, targetLift: 4.4, yaw: -0.24 },
    tour: 'The Engineering District. Four towers, four systems: ARIA, DevTrack, Stratify and PhishGuard AI.',
  },
  {
    id: 'experience',
    index: '04',
    title: 'Experience',
    place: 'Guild Hall',
    subtitle: 'Open source contributions',
    icon: 'briefcase',
    island: { pos: [22, 2.5, -15], r: 4, depth: 3.8, seed: 37, density: 2, bob: 0.2 },
    clear: 2.9,
    height: 4.8,
    label: { at: [0, 5.3, 0], align: 'top' },
    view: { dist: 16, lift: 2, targetLift: 2.2, yaw: -0.38 },
    tour: 'The Guild Hall. Backend contributions to OpenMRS Core: bulk SQL refactors and retry-safe archiving.',
  },
  {
    id: 'achievements',
    index: '05',
    title: 'Achievements',
    place: 'Hall of Achievements',
    subtitle: 'Contests, certifications and milestones',
    icon: 'trophy',
    island: { pos: [-27, 5.5, -22], r: 4, depth: 4.4, seed: 53, density: 2, bob: 0.18 },
    clear: 2.7,
    height: 5.8,
    label: { at: [0, 6.4, 0], align: 'top' },
    view: { dist: 17, lift: 2, targetLift: 3, yaw: 0.38 },
    tour: 'The Hall of Achievements. LeetCode Top 8.46% (rating 1798), GSSoC 2026, OpenMRS Core and an Oracle certification.',
  },
  {
    id: 'contact',
    index: '06',
    title: 'Contact',
    place: 'Contact Gateway',
    subtitle: "Let's build something together",
    icon: 'mail',
    island: { pos: [15, -4, 0], r: 3.4, depth: 3.4, seed: 83, density: 1.6, bob: 0.16 },
    clear: 2.4,
    height: 4.2,
    label: { at: [-1.9, 2.4, 0], align: 'left' },
    view: { dist: 14, lift: 1.4, targetLift: 2.2, yaw: -0.32 },
    tour: 'The Contact Gateway. Open to opportunities, interesting projects and conversations about technology.',
  },
];

/** Towers of the Engineering District, relative to the projects island top. */
export const districtTowers: Record<
  ProjectId,
  { offset: V3; height: number; name: string; view: { dist: number; yaw: number; lift: number } }
> = {
  // Each tower is framed from its own open side so no neighbour blocks it.
  aria: { offset: [-0.2, 0, -1.7], height: 9.2, name: 'ARIA', view: { dist: 20, yaw: 0.08, lift: 3.8 } },
  devtrack: { offset: [2.6, 0, 0.1], height: 6.2, name: 'DevTrack', view: { dist: 18, yaw: -0.58, lift: 2.8 } },
  stratify: { offset: [-2.7, 0, 0.2], height: 5.6, name: 'Stratify', view: { dist: 18, yaw: 0.58, lift: 2.8 } },
  phishing: { offset: [0.4, 0, 2.5], height: 3.6, name: 'PhishGuard AI', view: { dist: 15, yaw: -0.12, lift: 3.4 } },
};

export const landmarkIds = landmarks.map((l) => l.id);
const byId = new Map(landmarks.map((l) => [l.id, l]));
export const getLandmark = (id: LandmarkId) => byId.get(id)!;
export const isLandmarkId = (v: string): v is LandmarkId => byId.has(v as LandmarkId);

/** Stops of the guided tour, also used for the panel's previous/next links. */
export const journey: LandmarkId[] = ['about', 'projects', 'experience', 'achievements', 'contact'];

/** Gentle floating motion shared by islands and their label anchors. */
export const bobY = (cfg: IslandCfg, t: number) => Math.sin(t * 0.35 + cfg.seed * 1.7) * cfg.bob;

/* ------------------------------------------------------------------ */
/* Camera viewpoints                                                   */
/* ------------------------------------------------------------------ */

export interface View {
  pos: V3;
  target: V3;
  fov: number;
}

/** Wide screens see the whole world; narrow screens pull back and widen the lens. */
export function overviewFor(aspect: number): View {
  if (aspect >= 1.3) return { pos: [0, 5.5, 36], target: [0, 2.2, -6], fov: 40 };
  if (aspect >= 0.9) return { pos: [0, 7, 46], target: [0, 3, -8], fov: 46 };
  return { pos: [0, 11, 54], target: [0, 5, -10], fov: 58 };
}

function orbitFrom(target: V3, from: V3, dist: number, yaw: number, lift: number): V3 {
  let dx = from[0] - target[0];
  let dz = from[2] - target[2];
  const len = Math.hypot(dx, dz) || 1;
  dx /= len;
  dz /= len;
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return [target[0] + (dx * c - dz * s) * dist, target[1] + lift, target[2] + (dx * s + dz * c) * dist];
}

export function viewFor(id: LandmarkId, aspect: number, project: ProjectId | null = null): View {
  const ov = overviewFor(aspect);
  if (id === 'home') return ov;
  const l = getLandmark(id);
  const [px, py, pz] = l.island.pos;
  const narrow = aspect < 0.9 ? 1.5 : aspect < 1.3 ? 1.2 : 1;
  const fov = aspect < 0.9 ? 56 : 42;

  if (id === 'projects' && project) {
    const t = districtTowers[project];
    // Frame the whole tower (and ARIA's hologram) from outside the district.
    const target: V3 = [px + t.offset[0], py + t.height * 0.55, pz + t.offset[2]];
    return { pos: orbitFrom(target, ov.pos, t.view.dist * narrow, t.view.yaw, t.view.lift), target, fov };
  }

  const target: V3 = [px, py + l.view.targetLift, pz];
  return { pos: orbitFrom(target, ov.pos, l.view.dist * narrow, l.view.yaw, l.view.lift), target, fov };
}
