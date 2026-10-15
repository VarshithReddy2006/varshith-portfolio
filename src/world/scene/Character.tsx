/**
 * The traveller: a stylised, faceless figure representing the visitor.
 *
 * Built in code as a joint hierarchy (hips → spine → neck / shoulders →
 * elbows, hips → knees → ankles) and animated procedurally: idle breathing
 * and glances, a walk cycle driven by distance travelled (so feet don't
 * slide), and a climbing variant with higher knee lift and forward lean.
 * No external model is required; a GLB could replace the meshes later
 * without touching the journey logic.
 *
 * Forward is -z. All motion reads the shared journey runtime.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { runtime } from '../journey';
import { useDisposable, useKit } from './kit';

interface Limb {
  upper: THREE.Group | null;
  lower: THREE.Group | null;
  end: THREE.Group | null;
}

const newLimb = (): Limb => ({ upper: null, lower: null, end: null });

export function Character() {
  const kit = useKit();
  const root = useRef<THREE.Group>(null);
  const hips = useRef<THREE.Group>(null);
  const spine = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const legs = useRef([newLimb(), newLimb()]);
  const arms = useRef([newLimb(), newLimb()]);

  const shadow = useRef<THREE.Mesh>(null);

  const geo = useMemo(
    () => ({
      torso: new THREE.CapsuleGeometry(0.17, 0.3, 6, 12),
      pelvis: new THREE.CapsuleGeometry(0.15, 0.06, 4, 10),
      head: new THREE.SphereGeometry(0.115, 18, 14),
      hood: new THREE.SphereGeometry(0.14, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.66),
      cowl: new THREE.CylinderGeometry(0.12, 0.24, 0.18, 12, 1, true),
      neck: new THREE.CylinderGeometry(0.05, 0.06, 0.1, 10),
      belt: new THREE.CylinderGeometry(0.18, 0.18, 0.055, 14),
      buckle: new THREE.BoxGeometry(0.07, 0.05, 0.03),
      coatSkirt: new THREE.CylinderGeometry(0.17, 0.22, 0.16, 12, 1, true),
      thigh: new THREE.CapsuleGeometry(0.072, 0.3, 4, 10),
      shin: new THREE.CapsuleGeometry(0.058, 0.32, 4, 10),
      boot: new THREE.BoxGeometry(0.1, 0.075, 0.26),
      bootCuff: new THREE.CylinderGeometry(0.072, 0.08, 0.07, 10),
      upperArm: new THREE.CapsuleGeometry(0.052, 0.2, 4, 10),
      foreArm: new THREE.CapsuleGeometry(0.045, 0.2, 4, 10),
      gauntlet: new THREE.CylinderGeometry(0.058, 0.052, 0.08, 10),
      hand: new THREE.SphereGeometry(0.044, 10, 8),
      pack: new THREE.BoxGeometry(0.3, 0.36, 0.15),
      bedroll: new THREE.CylinderGeometry(0.065, 0.065, 0.32, 12),
      pouch: new THREE.BoxGeometry(0.08, 0.12, 0.1),
    }),
    [],
  );
  const mats = useDisposable(() => {
    const m = {
      // Warm restrained rim emissive lighting to pop against dark architecture
      hoodie: new THREE.MeshStandardMaterial({
        color: '#221f1b',
        roughness: 0.74,
        metalness: 0.1,
        emissive: '#42301c',
        emissiveIntensity: 0.38,
      }),
      pants: new THREE.MeshStandardMaterial({
        color: '#181614',
        roughness: 0.78,
        emissive: '#2b1e12',
        emissiveIntensity: 0.28,
      }),
      leather: new THREE.MeshStandardMaterial({
        color: '#261f18',
        roughness: 0.6,
        metalness: 0.22,
        emissive: '#352516',
        emissiveIntensity: 0.32,
      }),
      dark: new THREE.MeshStandardMaterial({
        color: '#11100f',
        roughness: 0.65,
        emissive: '#24180e',
        emissiveIntensity: 0.24,
      }),
      pack: new THREE.MeshStandardMaterial({
        color: '#2c2721',
        roughness: 0.66,
        metalness: 0.16,
        emissive: '#3b2918',
        emissiveIntensity: 0.35,
      }),
      // Warm champagne-gold edge trim
      trim: new THREE.MeshBasicMaterial({ color: '#dfb06c', toneMapped: false }),
    };
    const list = Object.values(m);
    return Object.assign(m, { dispose: () => list.forEach((x) => x.dispose()) });
  });
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  useFrame(({ clock }) => {
    const g = root.current;
    if (!g) return;
    const t = clock.elapsedTime * kit.q.motion;
    const [x, y, z] = runtime.pos;
    g.position.set(x, y, z);

    const w = runtime.walk;
    const c = runtime.climb;
    const ph = runtime.phase;
    const idle = 1 - w;

    // Contact shadow fits snugly on each stair tread when climbing
    if (shadow.current) {
      shadow.current.scale.set(0.72, c > 0.4 ? 0.46 : 0.68, 1);
    }

    // Body: bob twice per stride, lean into the climb, breathe when idle.
    if (hips.current) {
      hips.current.position.y = 0.92 + w * (0.025 * Math.abs(Math.cos(ph)) - 0.012) - c * 0.04;
      hips.current.position.x = idle * Math.sin(t * 0.5) * 0.012;
      hips.current.rotation.y = w * Math.sin(ph) * 0.08;
    }
    if (spine.current) spine.current.rotation.x = -(w * 0.06 + c * 0.16);
    if (chest.current) {
      const breath = 1 + idle * Math.sin(t * 1.7) * 0.012;
      chest.current.scale.set(1, breath, 1);
      chest.current.rotation.y = -w * Math.sin(ph) * 0.12;
    }
    if (head.current) {
      head.current.rotation.y = idle * Math.sin(t * 0.33) * 0.3;
      head.current.rotation.x = c * 0.18 - idle * 0.05;
    }

    // Legs (left = 0 phase, right = +π). Positive x-rotation swings forward.
    legs.current.forEach((leg, i) => {
      const p = ph + i * Math.PI;
      const swing = Math.sin(p);
      const lift = Math.max(0, Math.cos(p));
      const thigh = w * (0.42 * swing + c * (0.42 * Math.max(0, swing) + 0.12));
      const knee = -w * (0.08 + (0.62 + c * 0.55) * lift);
      if (leg.upper) leg.upper.rotation.x = thigh;
      if (leg.lower) leg.lower.rotation.x = knee;
      // Keep the sole roughly level with the ground.
      if (leg.end) leg.end.rotation.x = -(thigh + knee) * 0.92;
    });

    // Arms swing opposite to the legs; relaxed when idle.
    arms.current.forEach((arm, i) => {
      const p = ph + i * Math.PI;
      if (arm.upper) {
        arm.upper.rotation.x = -w * Math.sin(p) * (0.38 - c * 0.12) + idle * Math.sin(t * 1.7 + i) * 0.02;
        arm.upper.rotation.z = (i ? -1 : 1) * 0.08;
      }
      if (arm.lower) arm.lower.rotation.x = 0.22 + w * (0.25 + 0.2 * Math.max(0, -Math.sin(p)));
    });
  });

  const leg = (i: number, sx: number) => (
    <group
      key={`leg${i}`}
      position={[sx * 0.095, -0.02, 0]}
      ref={(el) => {
        legs.current[i].upper = el;
      }}
    >
      <mesh geometry={geo.thigh} material={mats.pants} position={[0, -0.22, 0]} />
      <group
        position={[0, -0.45, 0]}
        ref={(el) => {
          legs.current[i].lower = el;
        }}
      >
        <mesh geometry={geo.shin} material={mats.pants} position={[0, -0.22, 0]} />
        <group
          position={[0, -0.45, 0]}
          ref={(el) => {
            legs.current[i].end = el;
          }}
        >
          <mesh geometry={geo.boot} material={mats.leather} position={[0, -0.025, -0.05]} />
          <mesh geometry={geo.bootCuff} material={mats.leather} position={[0, 0.02, -0.02]} />
        </group>
      </group>
    </group>
  );

  const arm = (i: number, sx: number) => (
    <group
      key={`arm${i}`}
      position={[sx * 0.215, 0.28, 0]}
      ref={(el) => {
        arms.current[i].upper = el;
      }}
    >
      <mesh geometry={geo.upperArm} material={mats.hoodie} position={[0, -0.15, 0]} />
      <group
        position={[0, -0.3, 0]}
        ref={(el) => {
          arms.current[i].lower = el;
        }}
      >
        <mesh geometry={geo.foreArm} material={mats.hoodie} position={[0, -0.14, 0]} />
        <mesh geometry={geo.gauntlet} material={mats.leather} position={[0, -0.2, 0]} />
        <mesh geometry={geo.hand} material={mats.dark} position={[0, -0.3, 0]} />
      </group>
    </group>
  );

  return (
    <group ref={root} scale={0.92}>
      {/* Soft radial contact shadow correctly constrained to tread depth */}
      <mesh ref={shadow} rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} renderOrder={1}>
        <planeGeometry args={[0.9, 0.9]} />
        <meshBasicMaterial map={kit.glowTex} color="#000000" transparent opacity={0.65} depthWrite={false} />
      </mesh>
      <group ref={hips} position={[0, 0.92, 0]}>
        <mesh geometry={geo.pelvis} material={mats.pants} rotation-z={Math.PI / 2} scale={[1, 1.15, 0.9]} />
        {/* Belt, gold buckle and coat skirts */}
        <mesh geometry={geo.belt} material={mats.leather} position={[0, 0.05, 0]} />
        <mesh geometry={geo.buckle} material={mats.trim} position={[0, 0.05, -0.16]} />
        <mesh geometry={geo.coatSkirt} material={mats.hoodie} position={[0, -0.05, 0]} />
        {leg(0, -1)}
        {leg(1, 1)}
        <group ref={spine}>
          <group ref={chest}>
            <mesh geometry={geo.torso} material={mats.hoodie} position={[0, 0.27, 0]} scale={[1.18, 1, 0.82]} />
            {/* Structured Explorer Backpack */}
            <mesh geometry={geo.pack} material={mats.pack} position={[0, 0.28, 0.17]} />
            {/* Bedroll across top of backpack with twin gold buckles */}
            <mesh geometry={geo.bedroll} material={mats.leather} position={[0, 0.49, 0.16]} rotation-z={Math.PI / 2} />
            {[-0.09, 0.09].map((sx) => (
              <mesh key={sx} geometry={geo.buckle} material={mats.trim} position={[sx, 0.49, 0.23]} scale={[0.4, 0.6, 0.5]} />
            ))}
            {/* Side utility pouches */}
            {[-1, 1].map((sx) => (
              <mesh key={sx} geometry={geo.pouch} material={mats.leather} position={[sx * 0.19, 0.26, 0.16]} />
            ))}
            {/* Front harness shoulder straps with chest buckle */}
            {[-1, 1].map((sx) => (
              <mesh key={sx} geometry={geo.pack} material={mats.leather} position={[sx * 0.1, 0.33, -0.13]} scale={[0.12, 1.05, 0.08]} />
            ))}
            <mesh geometry={geo.buckle} material={mats.trim} position={[0, 0.34, -0.165]} scale={[0.6, 0.4, 0.5]} />
            {arm(0, -1)}
            {arm(1, 1)}
            <mesh geometry={geo.neck} material={mats.dark} position={[0, 0.56, 0]} />
            <group ref={head} position={[0, 0.68, 0]}>
              {/* Draped shoulder cowl joining hood seamlessly to shoulders */}
              <mesh geometry={geo.cowl} material={mats.hoodie} position={[0, -0.12, 0]} />
              <mesh geometry={geo.head} material={mats.dark} />
              <mesh geometry={geo.hood} material={mats.hoodie} position={[0, 0.01, 0.02]} rotation-x={-0.35} />
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}
