/**
 * The arrival journey: stage → staircase → Home gateway.
 *
 * Pure data and a mutable runtime (no React, no Three.js) so the character,
 * camera rig, fog and HUD can all read the same per-frame values without
 * re-rendering anything.
 *
 * The path runs straight along -z at x = 0:
 *   stage centre (z 22, y -8) → stairs foot (z 15.4) → stairs top (z 0.4, y -1)
 *   → stand point in front of the Home gateway (z -3).
 */

export const STAGE = { x: 0, y: -8, z: 22, r: 7 } as const;
export const STAIRS = {
  bottomZ: 15.4,
  topZ: 0.4,
  bottomY: -8,
  topY: -1,
  steps: 21,
  width: 3.6,
} as const;
export const STAIR_RUN = (STAIRS.bottomZ - STAIRS.topZ) / STAIRS.steps;
export const STAIR_RISE = (STAIRS.topY - STAIRS.bottomY) / STAIRS.steps;
export const STAND_Z = -3;

/** Distance along the path is simply "how far we have walked toward -z". */
export const PATH_LENGTH = STAGE.z - STAND_Z;
/** Path distance at which the character reaches the top of the stairs. */
export const S_STAIRS_BOTTOM = STAGE.z - STAIRS.bottomZ;
export const S_STAIRS_TOP = STAGE.z - STAIRS.topZ;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/**
 * Height of the walking surface at `z`. On the stairs the body rises one
 * riser per tread, easing up just before each edge so the planted foot stays
 * on the tread instead of sliding up a ramp.
 */
export function groundY(z: number) {
  if (z >= STAIRS.bottomZ + 0.25) return STAIRS.bottomY;
  if (z <= STAIRS.topZ) return STAIRS.topY;
  const t = (STAIRS.bottomZ - z) / STAIR_RUN + 0.35;
  const k = Math.min(STAIRS.steps, Math.max(0, Math.floor(t)));
  const frac = k >= STAIRS.steps ? 0 : smoothstep(0, 0.6, t - k);
  return STAIRS.bottomY + STAIR_RISE * Math.min(STAIRS.steps, k + frac);
}

/** 0 on flat ground, 1 while climbing (used for posture and knee lift). */
export const climbAt = (z: number) => (z < STAIRS.bottomZ + 0.3 && z > STAIRS.topZ - 0.2 ? 1 : 0);

export interface JourneyRuntime {
  /** Distance walked along the path (0 … PATH_LENGTH). */
  s: number;
  pos: [number, number, number];
  /** Gait phase in radians and smoothed walk / climb blends. */
  phase: number;
  walk: number;
  climb: number;
  /** Held-key direction in manual walk mode (-1, 0, 1). */
  manualDir: number;
  /** Keep walking to the stand point after arriving naturally. */
  autoFinish: boolean;
  /** How much of the world is revealed (fog, connections): 0 … 1. */
  reveal: number;
}

export const runtime: JourneyRuntime = {
  s: 0,
  pos: [STAGE.x, STAGE.y, STAGE.z],
  phase: 0,
  walk: 0,
  climb: 0,
  manualDir: 0,
  autoFinish: false,
  reveal: 0,
};

/** Walking speed (units/s along z). Slower on the stairs. */
export const speedAt = (z: number) => (climbAt(z) ? 1.9 : 2.2);

/** Progress through the ascent, used by the follow camera: 0 at the stage, 1 at the top. */
export const ascent = (s: number) => smoothstep(S_STAIRS_BOTTOM - 2, S_STAIRS_TOP, s);
