/**
 * Frame-loop side of the arrival journey:
 *  - JourneyDriver advances the traveller along the path (auto or held keys),
 *    derives gait phase from distance walked, and computes the world reveal.
 *  - RevealFog thins the fog as the world reveals itself.
 * Mounted before the camera rig so the rig always reads this frame's pose.
 */
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import {
  PATH_LENGTH,
  S_STAIRS_TOP,
  STAGE,
  STAIR_RUN,
  climbAt,
  groundY,
  runtime,
  speedAt,
} from '../journey';
import { arrive, world } from '../store';
import { useKit } from './kit';

const STRIDE = STAIR_RUN * 2; // exact mathematical stride matching two stair treads (no foot slide)
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function JourneyDriver() {
  const { q } = useKit();
  useFrame((_, delta) => {
    // Real elapsed time (capped) so the journey takes the same ~13 s on slow devices.
    const dt = Math.min(delta, 0.25);
    const s = world.get();
    const prev = runtime.s;

    if (s.intro === 'walking') {
      const z = STAGE.z - runtime.s;
      const v = speedAt(z);
      const dir = s.manual ? runtime.manualDir : 1;
      runtime.s = Math.min(PATH_LENGTH, Math.max(0, runtime.s + dir * v * dt));
      if (runtime.s >= S_STAIRS_TOP + 0.4) arrive({ natural: true });
    } else if (s.intro === 'arrived' && runtime.autoFinish && runtime.s < PATH_LENGTH) {
      // Natural arrival: walk the last few metres to the gateway, slowing down.
      const left = PATH_LENGTH - runtime.s;
      runtime.s = Math.min(PATH_LENGTH, runtime.s + speedAt(0) * Math.min(1, left / 1.2 + 0.25) * dt);
    } else if (s.intro === 'stage') {
      runtime.s = 0;
    }

    const z = STAGE.z - runtime.s;
    runtime.pos[0] = STAGE.x;
    runtime.pos[2] = z;
    runtime.pos[1] = groundY(z);

    // Gait: phase follows distance actually covered, so feet never slide.
    const moved = runtime.s - prev;
    const dist = Math.abs(moved) * (climbAt(z) ? 1.1 : 1);
    runtime.phase += (dist / STRIDE) * Math.PI * 2 * Math.sign(moved || 1);
    const moving = Math.abs(moved) > 1e-4 ? 1 : 0;
    const k = 1 - Math.exp(-dt * 8);
    runtime.walk += (moving - runtime.walk) * k;
    runtime.climb += (climbAt(z) * moving - runtime.climb) * k;

    // Reveal: fog thins and connections brighten as the traveller rises.
    const target = s.intro === 'arrived' || s.mode !== '3d' ? 1 : smoothstep(3, S_STAIRS_TOP + 1, runtime.s) * 0.8;
    runtime.reveal += (target - runtime.reveal) * (q.motion ? 1 - Math.exp(-dt * 1.1) : 1);
  });
  return null;
}

/** Dense, mysterious fog on the stage; the clear evening once arrived. */
export function RevealFog() {
  const scene = useThree((s) => s.scene);
  useFrame(() => {
    const fog = scene.fog as THREE.FogExp2 | null;
    if (fog) fog.density = THREE.MathUtils.lerp(0.024, 0.0055, runtime.reveal);
  });
  return null;
}
