/**
 * The central starting stage and the monumental staircase that connects it
 * to the Home island. Geometry is placed from the shared journey constants
 * (src/world/journey.ts) so the character walks exactly on these surfaces.
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { STAGE, STAIRS, STAIR_RISE, STAIR_RUN } from '../journey';
import { buildRock } from './builders';
import { InstanceSet, useDisposable, useKit, type Inst } from './kit';

/** Pillar lamp: stone post, lit cap, soft glow. */
function lamps(points: [number, number, number][], h: number, glowFor = (_z: number) => 1): { posts: Inst[]; caps: Inst[]; glows: Inst[] } {
  const posts: Inst[] = [];
  const caps: Inst[] = [];
  const glows: Inst[] = [];
  for (const [x, y, z] of points) {
    posts.push({ p: [x, y + h / 2, z], s: [0.34, h, 0.34] });
    caps.push({ p: [x, y + h + 0.13, z], s: [0.22, 0.26, 0.22] });
    const g = glowFor(z) * 1.1;
    if (g > 0) glows.push({ p: [x, y + h + 0.15, z + 0.02], s: [g, g, 1] });
  }
  return { posts, caps, glows };
}

/* ------------------------------------------------------------------ */
/* Central stage                                                       */
/* ------------------------------------------------------------------ */

export function CentralStage() {
  const kit = useKit();
  const spinA = useRef<THREE.Group>(null);
  const spinB = useRef<THREE.Group>(null);
  const rock = useDisposable(() => buildRock(STAGE.r * 0.94, 7, 909, 16));
  const arcA = useDisposable(() => new THREE.TorusGeometry(2.8, 0.035, 3, 64, Math.PI * 0.62));
  const arcB = useDisposable(() => new THREE.TorusGeometry(5.4, 0.03, 3, 96, Math.PI * 0.62));

  const parts = useMemo(() => {
    // Engraved radial ticks on three bands.
    const ticks: Inst[] = [];
    [
      [2.95, 48],
      [4.35, 72],
      [5.75, 96],
    ].forEach(([r, n], band) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const len = i % 4 === 0 ? 0.42 : 0.2;
        ticks.push({ p: [Math.cos(a) * r, 0.012, Math.sin(a) * r], s: [0.035 + band * 0.005, 0.012, len], r: Math.PI / 2 - a });
      }
    });
    // Inlaid floor panels between the rings.
    const panels: Inst[] = [];
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + Math.PI / 12;
      panels.push({ p: [Math.cos(a) * 5.05, 0.006, Math.sin(a) * 5.05], s: [0.9, 0.012, 1.6], r: Math.PI / 2 - a });
    }
    // Eight lamp pillars on the rim; none directly behind the start (camera side)
    // or in front of the stairs entry.
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      pts.push([Math.cos(a) * (STAGE.r - 0.45), 0, Math.sin(a) * (STAGE.r - 0.45)]);
    }
    // Lamps on the camera side of the stage sit close to the lens: no halo there.
    return { ticks, panels, ...lamps(pts, 1.25, (z) => (z > 1 ? 0 : 0.8)) };
  }, []);

  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05) * kit.q.motion;
    if (spinA.current) spinA.current.rotation.y += d * 0.06;
    if (spinB.current) spinB.current.rotation.y -= d * 0.04;
  });

  const ring = (r: number, tube: number, mat: THREE.Material, y = 0.02) => (
    <mesh material={mat} position={[0, y, 0]} rotation-x={Math.PI / 2}>
      <torusGeometry args={[r, tube, 4, 128]} />
    </mesh>
  );

    return (
    <group position={[STAGE.x, STAGE.y, STAGE.z]}>
      <mesh geometry={rock} material={kit.rock} position={[0, -0.9, 0]} castShadow receiveShadow />
      {/* Elevated deck: plinth, top plate and bevelled rim */}
      <mesh material={kit.metal} position={[0, -0.45, 0]} receiveShadow>
        <cylinderGeometry args={[STAGE.r, STAGE.r * 0.97, 0.9, 64]} />
      </mesh>
      <mesh material={kit.bronze} position={[0, -0.95, 0]} receiveShadow>
        <cylinderGeometry args={[STAGE.r * 0.97, STAGE.r * 0.9, 0.2, 48]} />
      </mesh>
      {ring(STAGE.r, 0.06, kit.light, -0.02)}
      {ring(STAGE.r - 0.02, 0.03, kit.light, -0.9)}

      {/* Concentric golden rings */}
      {ring(1.25, 0.045, kit.light)}
      {ring(2.25, 0.02, kit.dimGold)}
      {ring(3.35, 0.06, kit.light)}
      {ring(4.0, 0.015, kit.dimGold)}
      {ring(4.7, 0.025, kit.dimGold)}
      {ring(6.35, 0.05, kit.light)}
      <InstanceSet items={parts.ticks} geometry={kit.box} material={kit.dimGold} />
      <InstanceSet items={parts.panels} geometry={kit.box} material={kit.bronze} />
      {/* Slowly turning broken arcs */}
      <group ref={spinA}>
        {[0, (Math.PI * 2) / 3, (Math.PI * 4) / 3].map((a) => (
          <mesh key={a} geometry={arcA} material={kit.light} position={[0, 0.025, 0]} rotation={[Math.PI / 2, 0, a]} />
        ))}
      </group>
      <group ref={spinB}>
        {[0, Math.PI].map((a) => (
          <mesh key={a} geometry={arcB} material={kit.dimGold} position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, a]} />
        ))}
      </group>
      {/* Warm pool of light at the centre where the visitor stands */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.03, 0]}>
        <circleGeometry args={[1.0, 40]} />
        <meshBasicMaterial map={kit.glowTex} color="#ffc277" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <pointLight color="#ffc47f" intensity={8} distance={7} decay={2} position={[0, 0.5, 0]} />

      <InstanceSet items={parts.posts} geometry={kit.box} material={kit.metal} />
      <InstanceSet items={parts.caps} geometry={kit.box} material={kit.light} />
      <InstanceSet items={parts.glows} geometry={kit.plane} material={kit.glow} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Staircase                                                           */
/* ------------------------------------------------------------------ */

export function Staircase() {
  const kit = useKit();
  const parts = useMemo(() => {
    const steps: Inst[] = [];
    const noses: Inst[] = [];
    const w = STAIRS.width;
    for (let i = 0; i < STAIRS.steps; i++) {
      const top = STAIRS.bottomY + (i + 1) * STAIR_RISE;
      const zc = STAIRS.bottomZ - (i + 0.5) * STAIR_RUN;
      const h = STAIR_RISE + 0.45;
      steps.push({ p: [0, top - h / 2, zc], s: [w, h, STAIR_RUN + 0.01] });
      // A thin dim strip on each nosing, brighter every third step.
      noses.push({ p: [0, top - 0.02, zc + STAIR_RUN / 2 + 0.005], s: [w - 0.5, 0.025, 0.02] });
    }
    const lampPts: [number, number, number][] = [];
    for (const i of [2, 8, 14, 20]) {
      const top = STAIRS.bottomY + (i + 1) * STAIR_RISE;
      const zc = STAIRS.bottomZ - (i + 0.5) * STAIR_RUN;
      for (const sx of [-1, 1]) lampPts.push([sx * (w / 2 + 0.25), top, zc]);
    }
    return { steps, noses, ...lamps(lampPts, 0.95) };
  }, []);

  const run = STAIRS.bottomZ - STAIRS.topZ;
  const rise = STAIRS.topY - STAIRS.bottomY;
  const len = Math.hypot(run, rise);
  const angle = Math.atan2(rise, run);
  const midZ = (STAIRS.bottomZ + STAIRS.topZ) / 2;
  const midY = (STAIRS.bottomY + STAIRS.topY) / 2;

  return (
    <group>
      <InstanceSet items={parts.steps} geometry={kit.box} material={kit.metal} />
      <InstanceSet items={parts.noses} geometry={kit.box} material={kit.dimGold} />
      {/* Side stringers with continuous golden edge strips */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * (STAIRS.width / 2 + 0.12), midY, midZ]} rotation-x={angle}>
          <mesh geometry={kit.box} material={kit.metal} position={[0, -0.05, 0]} scale={[0.28, 0.7, len + 0.4]} />
          <mesh geometry={kit.box} material={kit.light} position={[0, 0.31, 0]} scale={[0.07, 0.04, len + 0.4]} />
          <mesh geometry={kit.box} material={kit.light} position={[sx * 0.15, -0.2, 0]} scale={[0.02, 0.03, len + 0.2]} />
        </group>
      ))}
      {/* Underside beam so the flight reads as one solid structure */}
      <group position={[0, midY - 0.9, midZ]} rotation-x={angle}>
        <mesh geometry={kit.box} material={kit.stone} scale={[STAIRS.width * 0.7, 0.8, len]} />
      </group>
      {/* Landings joining the stage and the Home island */}
      <mesh geometry={kit.box} material={kit.metal} position={[0, STAIRS.bottomY - 0.2, STAIRS.bottomZ + 0.15]} scale={[STAIRS.width + 0.6, 0.4, 0.5]} />
      <mesh geometry={kit.box} material={kit.metal} position={[0, STAIRS.topY - 0.18, STAIRS.topZ - 0.6]} scale={[STAIRS.width + 0.6, 0.36, 1.4]} />
      <mesh geometry={kit.box} material={kit.light} position={[0, STAIRS.topY + 0.005, STAIRS.topZ - 0.6]} scale={[STAIRS.width - 0.3, 0.012, 0.05]} />

      <InstanceSet items={parts.posts} geometry={kit.box} material={kit.metal} />
      <InstanceSet items={parts.caps} geometry={kit.box} material={kit.light} />
      <InstanceSet items={parts.glows} geometry={kit.plane} material={kit.glow} />
    </group>
  );
}
