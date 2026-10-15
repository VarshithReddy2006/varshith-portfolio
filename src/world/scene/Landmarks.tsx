/**
 * The six interactive landmarks. Each one is a floating island with a
 * distinct building, generic city filler, a selection ring, and an invisible
 * hit volume that receives pointer events. Highlight state is read from the
 * world store inside the frame loop, so hovering never re-renders React.
 */
import { createContext, useContext, useMemo, useRef, type JSX, type ReactNode } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import { ariaGraph } from '../../components/three/ariaGraph';
import { bobY, districtTowers, type LandmarkDef, type ProjectId } from '../landmarks';
import { hover, hoverProject, select, selectProject, world } from '../store';
import { buildCity, buildRock, buildTrees, buildVines } from './builders';
import { InstanceSet, useDisposable, useKit, type Inst } from './kit';
import { mulberry32 } from '../../lib/rng';

const AccentContext = createContext<THREE.MeshStandardMaterial | null>(null);
const useAccent = () => useContext(AccentContext)!;

const makeAccent = () =>
  new THREE.MeshStandardMaterial({
    color: '#2a2219',
    emissive: '#f0a95a',
    emissiveIntensity: 0.45,
    roughness: 0.45,
    metalness: 0.6,
  });

const damp = (dt: number, rate: number) => 1 - Math.exp(-Math.min(dt, 0.05) * rate);

/* ------------------------------------------------------------------ */
/* Landmark wrapper                                                    */
/* ------------------------------------------------------------------ */

const DRAG_TOLERANCE = 6;

function setCursor(el: HTMLElement, c: string) {
  if (el.style.cursor !== c) el.style.cursor = c;
}

export function LandmarkNode({ def, children }: { def: LandmarkDef; children: ReactNode }) {
  const kit = useKit();
  const gl = useThree((s) => s.gl);
  const group = useRef<THREE.Group>(null);
  const glow = useRef<THREE.Sprite>(null);
  const h = useRef(0);
  const cfg = def.island;

  const rock = useDisposable(() => buildRock(cfg.r, cfg.depth, cfg.seed, kit.q.tier === 'high' ? 24 : 16), [cfg, kit.q.tier]);
  const city = useMemo(() => buildCity(cfg, def.clear, kit.q.city, def.corridor), [cfg, def.clear, kit.q.city, def.corridor]);
  const trees = useMemo(() => buildTrees(cfg, def.clear, kit.q.city, def.corridor), [cfg, def.clear, kit.q.city, def.corridor]);
  const vines = useMemo(() => buildVines(cfg), [cfg]);
  const accent = useDisposable(makeAccent);
  const ring = useDisposable(
    () => new THREE.MeshBasicMaterial({ color: '#f2c786', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
  );

  // Cascading waterfalls spilling from mountain islands
  const falls = useMemo<Inst[]>(() => {
    if (def.id === 'home' || def.id === 'projects') return [];
    const out: Inst[] = [];
    for (const a of [Math.PI * 0.62, Math.PI * 0.3]) {
      const len = cfg.depth * 2.2;
      out.push({ p: [Math.cos(a) * cfg.r * 0.95, -len / 2, Math.sin(a) * cfg.r * 0.95], s: [0.65, len, 1], r: Math.PI / 2 - a });
    }
    return out;
  }, [def.id, cfg]);

  // Waterfall mist sprites billowed at base of falls
  const mists = useMemo<Inst[]>(() => {
    if (def.id === 'home' || def.id === 'projects') return [];
    const out: Inst[] = [];
    for (const a of [Math.PI * 0.62, Math.PI * 0.3]) {
      const len = cfg.depth * 2.2;
      out.push({ p: [Math.cos(a) * cfg.r * 0.95, -len, Math.sin(a) * cfg.r * 0.95], s: [2.5, 2.5, 1], r: 0 });
    }
    return out;
  }, [def.id, cfg]);

  useFrame(({ clock }, dt) => {
    const s = world.get();
    const t = clock.elapsedTime * kit.q.motion;
    if (group.current) {
      // Natural buoyancy: multi-harmonic vertical float + gentle mountain pitch & roll
      group.current.position.y = cfg.pos[1] + bobY(cfg, t);
      if (cfg.bob > 0) {
        group.current.rotation.x = Math.sin(t * 0.28 + cfg.seed) * 0.016 * cfg.bob;
        group.current.rotation.z = Math.cos(t * 0.22 + cfg.seed * 2) * 0.014 * cfg.bob;
      }
    }
    const target = s.active === def.id && def.id !== 'home' ? 1 : s.hovered === def.id ? 0.75 : 0;
    h.current += (target - h.current) * damp(dt, 6);
    const v = h.current;
    const pulse = s.active === def.id ? 0.12 * Math.sin(clock.elapsedTime * 2.4) * kit.q.motion : 0;
    accent.emissiveIntensity = 0.45 + v * 1.25 + pulse;
    ring.opacity = v * 0.85 + (v > 0.5 ? pulse : 0);
    if (glow.current) (glow.current.material as THREE.SpriteMaterial).opacity = 0.12 + v * 0.4;
  });

  const handlers = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => {
      e.stopPropagation();
      hover(def.id);
      setCursor(gl.domElement, 'pointer');
    },
    onPointerMove: (e: ThreeEvent<PointerEvent>) => {
      if (def.id !== 'projects') return;
      const tower = e.intersections.find((i) => i.object.userData.project)?.object.userData.project as ProjectId | undefined;
      hoverProject(tower ?? null);
    },
    onPointerOut: () => {
      if (world.get().hovered === def.id) hover(null);
      if (def.id === 'projects') hoverProject(null);
      setCursor(gl.domElement, '');
    },
    onClick: (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (e.delta > DRAG_TOLERANCE) return; // it was a drag, not a click
      const tower = e.intersections.find((i) => i.object.userData.project)?.object.userData.project as ProjectId | undefined;
      if (tower) selectProject(tower);
      else select(def.id);
    },
  };

  const hitH = def.height + cfg.depth * 0.45;

  return (
    <group ref={group} position={cfg.pos}>
      {/* Weathered crag rock body with realistic contact shadow casting */}
      <mesh geometry={rock} material={kit.rock} castShadow receiveShadow />

      {/* Lush alpine moss/grass plateau on top */}
      <mesh material={kit.grass} position={[0, 0.01, 0]} receiveShadow>
        <cylinderGeometry args={[cfg.r * 0.97, cfg.r * 0.97, 0.04, 32]} />
      </mesh>

      {/* Architectural stone rim slab */}
      <mesh material={kit.slab} position={[0, -0.08, 0]} receiveShadow>
        <cylinderGeometry args={[cfg.r * 0.985, cfg.r * 0.95, 0.18, 32]} />
      </mesh>

      <mesh rotation-x={Math.PI / 2} position={[0, 0.02, 0]} material={kit.light}>
        <torusGeometry args={[cfg.r * 0.975, 0.025, 4, 64]} />
      </mesh>

      {/* Selection ring */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0.06, 0]} material={ring}>
        <torusGeometry args={[cfg.r * 1.05, 0.07, 4, 96]} />
      </mesh>

      {/* Nature: Living alpine pines and stone conifers */}
      <InstanceSet items={trees.trunks} geometry={kit.cyl} material={kit.wood} />
      <InstanceSet items={trees.canopies} geometry={kit.cone} material={kit.foliage} />
      <InstanceSet items={trees.canopiesAmber} geometry={kit.cone} material={kit.foliageAmber} />

      {/* Hanging roots and creeping cliff vines */}
      <InstanceSet items={vines} geometry={kit.plane} material={kit.foliage} />

      {/* Masonry buildings, spires and lanterns */}
      <InstanceSet items={city.stones} geometry={kit.box} material={kit.stone} />
      <InstanceSet items={city.spires} geometry={kit.cone} material={kit.stone} />
      <InstanceSet items={city.windows} geometry={kit.box} material={kit.light} />
      <InstanceSet items={city.glows} geometry={kit.plane} material={kit.glow} />

      {/* Cascading waterfalls & misty spray */}
      <InstanceSet items={falls} geometry={kit.plane} material={kit.fall} />
      <InstanceSet items={mists} geometry={kit.plane} material={kit.glow} />

      <AccentContext.Provider value={accent}>{children}</AccentContext.Provider>

      <sprite ref={glow} position={[0, def.height * 0.55, 0]} scale={[cfg.r * 3.4, def.height * 2, 1]}>
        <spriteMaterial map={kit.glowTex} color="#ffae5c" transparent opacity={0.08} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
      </sprite>

      {/* Generous invisible hit volume (plus per-tower volumes for the district). */}
      <group {...handlers}>
        <mesh material={kit.hit} position={[0, (hitH - cfg.depth * 0.9) / 2, 0]}>
          <cylinderGeometry args={[cfg.r, cfg.r * 0.6, hitH + cfg.depth * 0.45, 12]} />
        </mesh>
        {def.id === 'projects' &&
          (Object.keys(districtTowers) as ProjectId[]).map((id) => {
            const t = districtTowers[id];
            return (
              <mesh
                key={id}
                material={kit.hit}
                userData={{ project: id }}
                position={[t.offset[0], t.height / 2, t.offset[2]]}
                scale={[1.6, t.height + 0.4, 1.6]}
                geometry={kit.cyl}
              />
            );
          })}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 01 Home — Central Portal                                            */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* 01 Home — Imperial Gateway & Energy Core                            */
/* ------------------------------------------------------------------ */

function createLancetArchGeometry(
  w: number,
  h: number,
  t: number,
  depth: number,
  springFrac = 0.52,
  bevel = 0.035,
): THREE.BufferGeometry {
  const outer = new THREE.Shape();
  const w2Out = w / 2 + t;
  const hSpring = h * springFrac;
  const hApexOut = h + t;
  const cxOut = ((hApexOut - hSpring) ** 2 - w2Out ** 2) / (2 * w2Out);
  const rOut = w2Out + cxOut;
  const apexAngOutL = Math.atan2(hApexOut - hSpring, -cxOut);
  const apexAngOutR = Math.atan2(hApexOut - hSpring, cxOut);

  outer.moveTo(-w2Out, 0);
  outer.lineTo(-w2Out, hSpring);
  outer.absarc(cxOut, hSpring, rOut, Math.PI, apexAngOutL, true);
  outer.absarc(-cxOut, hSpring, rOut, apexAngOutR, 0, true);
  outer.lineTo(w2Out, 0);
  outer.closePath();

  const hole = new THREE.Path();
  const w2In = w / 2;
  const hApexIn = h;
  const cxIn = ((hApexIn - hSpring) ** 2 - w2In ** 2) / (2 * w2In);
  const rIn = w2In + cxIn;
  const apexAngInL = Math.atan2(hApexIn - hSpring, -cxIn);
  const apexAngInR = Math.atan2(hApexIn - hSpring, cxIn);

  hole.moveTo(-w2In, 0);
  hole.lineTo(-w2In, hSpring);
  hole.absarc(cxIn, hSpring, rIn, Math.PI, apexAngInL, true);
  hole.absarc(-cxIn, hSpring, rIn, apexAngInR, 0, true);
  hole.lineTo(w2In, 0);
  hole.closePath();

  outer.holes.push(hole);

  return new THREE.ExtrudeGeometry(outer, {
    depth,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 16,
  });
}

function EnergyCore() {
  const kit = useKit();
  const g = useRef<THREE.Group>(null);
  const core = useRef<THREE.Mesh>(null);
  const shell = useRef<THREE.Mesh>(null);
  const ringA = useRef<THREE.Mesh>(null);
  const ringB = useRef<THREE.Mesh>(null);
  const ringC = useRef<THREE.Mesh>(null);
  const motes = useRef<THREE.Points>(null);

  // Subtle floating energy motes around the core
  const moteGeo = useDisposable(() => {
    const rnd = mulberry32(77);
    const count = 16;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = rnd() * Math.PI * 2;
      const phi = (rnd() - 0.5) * Math.PI * 0.8;
      const r = 0.8 + rnd() * 0.9;
      arr[i * 3] = r * Math.cos(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi);
      arr[i * 3 + 2] = r * Math.cos(phi) * Math.sin(theta);
    }
    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return geom;
  });

  useFrame(({ clock }, delta) => {
    const m = kit.q.motion;
    const dt = Math.min(delta, 0.05) * m;
    const t = clock.elapsedTime;
    if (g.current) {
      g.current.position.y = 4.6 + Math.sin(t * 0.9) * 0.14 * m;
    }
    if (core.current) {
      core.current.rotation.y += dt * 0.35;
      core.current.rotation.x += dt * 0.15;
    }
    if (shell.current) {
      shell.current.rotation.y -= dt * 0.2;
      shell.current.rotation.z += dt * 0.12;
    }
    if (ringA.current) ringA.current.rotation.z += dt * 0.28;
    if (ringB.current) ringB.current.rotation.x += dt * 0.22;
    if (ringC.current) ringC.current.rotation.y += dt * 0.18;
    if (motes.current) {
      motes.current.rotation.y += dt * 0.1;
    }
  });

  return (
    <group ref={g} position={[0, 4.6, -1.35]}>
      {/* Central faceted crystal polyhedron */}
      <mesh ref={core}>
        <octahedronGeometry args={[0.65, 0]} />
        <meshStandardMaterial
          color="#ffe4b0"
          emissive="#e89d44"
          emissiveIntensity={0.65}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {/* Delicate counter-rotating wireframe polyhedron */}
      <mesh ref={shell}>
        <icosahedronGeometry args={[1.18, 1]} />
        <meshBasicMaterial color="#e8c58a" wireframe transparent opacity={0.45} />
      </mesh>
      {/* Three concentric gold gimbal armillary rings */}
      <mesh ref={ringA} rotation-x={Math.PI / 2.5}>
        <torusGeometry args={[1.52, 0.024, 6, 80]} />
        <meshBasicMaterial color="#e8c58a" toneMapped={false} />
      </mesh>
      <mesh ref={ringB} rotation-y={Math.PI / 3.2}>
        <torusGeometry args={[1.82, 0.02, 6, 80]} />
        <meshBasicMaterial color="#f5dcae" transparent opacity={0.65} />
      </mesh>
      <mesh ref={ringC} rotation-z={Math.PI / 4}>
        <torusGeometry args={[2.12, 0.016, 6, 80]} />
        <meshBasicMaterial color="#dfb06c" transparent opacity={0.5} />
      </mesh>
      {/* Subtle floating gold energy motes */}
      <points ref={motes} geometry={moteGeo}>
        <pointsMaterial
          map={kit.glowTex}
          color="#ffcf8a"
          size={0.16}
          sizeAttenuation
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </points>
      {/* Controlled warm point light inside the gateway passage */}
      <pointLight color="#ffc879" intensity={3.0} distance={16} decay={2} />
      <sprite scale={[3.4, 3.4, 1]}>
        <spriteMaterial map={kit.glowTex} color="#ffad55" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </sprite>
    </group>
  );
}

export function CentralPortal() {
  const kit = useKit();
  const accent = useAccent();

  // Procedural Lancet Arch Geometries
  const arch1Stone = useDisposable(() => createLancetArchGeometry(5.0, 13.6, 0.55, 0.75));
  const arch1Liner = useDisposable(() => createLancetArchGeometry(5.0, 13.6, 0.08, 0.78, 0.52, 0.015));

  const arch2Stone = useDisposable(() => createLancetArchGeometry(4.1, 11.8, 0.45, 0.75));
  const arch2Liner = useDisposable(() => createLancetArchGeometry(4.1, 11.8, 0.08, 0.78, 0.52, 0.015));

  const arch3Stone = useDisposable(() => createLancetArchGeometry(3.3, 10.2, 0.40, 0.75));
  const arch3Liner = useDisposable(() => createLancetArchGeometry(3.3, 10.2, 0.08, 0.78, 0.52, 0.015));

  const parts = useMemo(() => {
    const stones: Inst[] = [];
    const spires: Inst[] = [];
    const windows: Inst[] = [];

    // Background flanking cathedral towers
    const towers: [number, number, number, number][] = [
      [-4.2, -3.4, 0.95, 10.5],
      [-3.0, -4.8, 0.85, 13.5],
      [-1.5, -5.6, 0.9, 11.5],
      [1.5, -5.6, 0.9, 14.5],
      [3.1, -4.7, 0.9, 12],
      [4.3, -3.3, 0.85, 9.5],
    ];
    for (const [x, z, w, h] of towers) {
      stones.push({ p: [x, h / 2, z], s: [w, h, w] }, { p: [x, h + 0.5, z], s: [w * 0.6, 1, w * 0.6] });
      spires.push({ p: [x, h + 1 + w * 1.2, z], s: [w * 0.5, w * 2.4, w * 0.5], r: Math.PI / 4 });
      for (let y = 0.6; y < h - 0.4; y += 0.55) {
        if ((x * 7 + y * 3) % 1 > 0.35) windows.push({ p: [x - w * 0.22, y, z + w / 2 + 0.01], s: [0.07, 0.16, 0.01] });
        if ((x * 5 + y * 11) % 1 > 0.45) windows.push({ p: [x + w * 0.22, y, z + w / 2 + 0.01], s: [0.07, 0.16, 0.01] });
      }
    }

    // Approach balustrade lanterns along the golden runner path
    for (let z = 1.0; z <= 5.2; z += 1.2) {
      for (const sx of [-1, 1]) {
        stones.push({ p: [sx * 1.4, 0.28, z], s: [0.18, 0.56, 0.18] });
        windows.push({ p: [sx * 1.4, 0.62, z], s: [0.14, 0.14, 0.14] });
      }
    }

    return { stones, spires, windows };
  }, []);

  return (
    <group>
      {/* 1. Foundation: Stepped architectural dais */}
      {[0, 1, 2].map((i) => (
        <group key={i}>
          <mesh
            geometry={kit.box}
            material={kit.slab}
            position={[0, 0.08 + i * 0.16, -1.0]}
            scale={[8.4 - i * 0.8, 0.16, 4.6 - i * 0.4]}
            receiveShadow
          />
          {/* Subtle champagne-gold nosing along dais steps */}
          <mesh
            geometry={kit.box}
            material={accent}
            position={[0, 0.16 + i * 0.16, 1.3 - i * 0.2]}
            scale={[8.3 - i * 0.8, 0.02, 0.03]}
          />
        </group>
      ))}

      {/* 2. Main Pillars / Stepped Buttress Towers */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          {/* Inner primary buttress */}
          <group position={[sx * 3.55, 0, -0.75]}>
            <mesh geometry={kit.box} material={kit.stone} position={[0, 0.6, 0]} scale={[1.3, 1.2, 1.3]} castShadow />
            <mesh geometry={kit.box} material={kit.stone} position={[0, 5.0, 0]} scale={[1.05, 7.6, 1.1]} castShadow />
            {/* Fine vertical gold pilaster rib on front face */}
            <mesh geometry={kit.box} material={accent} position={[0, 5.0, 0.56]} scale={[0.1, 7.4, 0.04]} />
            <mesh geometry={kit.box} material={accent} position={[-sx * 0.54, 5.0, 0]} scale={[0.04, 7.4, 0.1]} />
            {/* Mid shoulder set-back */}
            <mesh geometry={kit.box} material={kit.stone} position={[0, 10.3, 0]} scale={[0.8, 3.0, 0.85]} castShadow />
            <mesh geometry={kit.box} material={kit.stone} position={[0, 12.8, 0]} scale={[0.6, 2.0, 0.65]} castShadow />
            {/* Buttress crown spire */}
            <mesh geometry={kit.cone} material={kit.stone} position={[0, 15.6, 0]} scale={[0.6, 3.6, 0.6]} rotation-y={Math.PI / 4} castShadow />
            <mesh geometry={kit.box} material={accent} position={[0, 17.5, 0]} scale={[0.12, 0.35, 0.12]} />
          </group>

          {/* Outer secondary stepped buttress */}
          <group position={[sx * 4.7, 0, -0.75]}>
            <mesh geometry={kit.box} material={kit.stone} position={[0, 0.6, 0]} scale={[1.1, 1.2, 1.1]} castShadow />
            <mesh geometry={kit.box} material={kit.stone} position={[0, 4.5, 0]} scale={[0.85, 6.6, 0.85]} castShadow />
            <mesh geometry={kit.cone} material={kit.stone} position={[0, 9.3, 0]} scale={[0.55, 3.0, 0.55]} rotation-y={Math.PI / 4} castShadow />
          </group>
        </group>
      ))}

      {/* 3. Three Nested Gothic Lancet Arches (Real Architectural Depth) */}
      {/* Arch 1: Grand Outer Portal */}
      <group position={[0, 0.48, -1.15]}>
        <mesh geometry={arch1Stone} material={kit.stone} castShadow />
        <mesh geometry={arch1Liner} material={accent} position={[0, 0, 0.01]} />
      </group>

      {/* Arch 2: Middle Recessed Portal */}
      <group position={[0, 0.48, -2.0]}>
        <mesh geometry={arch2Stone} material={kit.stone} castShadow />
        <mesh geometry={arch2Liner} material={accent} position={[0, 0, 0.01]} />
      </group>

      {/* Arch 3: Inner Sanctuary Portal */}
      <group position={[0, 0.48, -2.85]}>
        <mesh geometry={arch3Stone} material={kit.stone} castShadow />
        <mesh geometry={arch3Liner} material={accent} position={[0, 0, 0.01]} />
      </group>

      {/* 4. Cathedral Crown: Asymmetrical Spires and Pinnacles */}
      {/* Central Soaring Apex Spire */}
      <group position={[0, 14.1, -0.75]}>
        <mesh geometry={kit.box} material={kit.stone} position={[0, 0.8, 0]} scale={[1.1, 1.6, 0.9]} castShadow />
        <mesh geometry={kit.cone} material={kit.stone} position={[0, 3.1, 0]} scale={[0.85, 4.8, 0.85]} rotation-y={Math.PI / 4} castShadow />
        <mesh geometry={kit.box} material={accent} position={[0, 5.6, 0]} scale={[0.16, 0.5, 0.16]} />
      </group>

      {/* Flanking Apex Pinnacles */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 1.25, 13.0, -0.75]}>
          <mesh geometry={kit.cone} material={kit.stone} position={[0, 2.0, 0]} scale={[0.62, 3.8, 0.62]} rotation-y={Math.PI / 4} castShadow />
          <mesh geometry={kit.box} material={accent} position={[0, 4.0, 0]} scale={[0.12, 0.35, 0.12]} />
        </group>
      ))}

      {/* Intermediate Crown Pinnacles */}
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * 2.35, 12.0, -0.75]}>
          <mesh geometry={kit.cone} material={kit.stone} position={[0, 1.6, 0]} scale={[0.5, 3.2, 0.5]} rotation-y={Math.PI / 4} castShadow />
        </group>
      ))}

      {/* 5. Genuinely Open Inner Passage & Sanctuary Depth */}
      {/* Dark sanctuary floor */}
      <mesh geometry={kit.box} material={kit.slab} position={[0, 0.44, -3.8]} scale={[4.8, 0.16, 3.6]} receiveShadow />
      {/* Radiating concentric gold inlaid arc in the sanctuary floor */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.53, -2.4]} material={accent}>
        <ringGeometry args={[1.2, 1.24, 32]} />
      </mesh>

      {/* Interior sanctuary colonnades */}
      {[-1, 1].map((sx) => (
        <group key={sx}>
          {[-2.9, -3.9, -4.9].map((z) => (
            <group key={z} position={[sx * 1.45, 0.48, z]}>
              <mesh geometry={kit.cyl} material={kit.stone} position={[0, 3.75, 0]} scale={[0.26, 7.5, 0.26]} />
              <mesh geometry={kit.box} material={accent} position={[0, 7.5, 0]} scale={[0.34, 0.1, 0.34]} />
            </group>
          ))}
        </group>
      ))}

      {/* Rear sanctuary wall with warm lancet slit windows */}
      <group position={[0, 0.48, -5.6]}>
        <mesh geometry={kit.box} material={kit.stone} position={[0, 4.5, 0]} scale={[5.4, 9.0, 0.6]} castShadow />
        {/* Three vertical warm slit windows providing atmospheric back-illumination */}
        {[-1.2, 0, 1.2].map((x) => (
          <mesh key={x} geometry={kit.box} material={kit.light} position={[x, 5.2, 0.31]} scale={[0.18, 2.8, 0.04]} />
        ))}
      </group>

      {/* 6. Suspended Geometric Energy Core */}
      <EnergyCore />

      {/* 7. Approach: Golden Light Runner connecting cleanly to the Staircase */}
      <mesh geometry={kit.box} material={kit.light} position={[0, 0.44, 3.2]} scale={[0.38, 0.02, 5.6]} />
      <mesh geometry={kit.box} material={accent} position={[0, 0.43, 3.2]} scale={[0.54, 0.015, 5.6]} />

      {/* Background towers and approach lamps */}
      <InstanceSet items={parts.stones} geometry={kit.box} material={kit.stone} />
      <InstanceSet items={parts.spires} geometry={kit.cone} material={kit.stone} />
      <InstanceSet items={parts.windows} geometry={kit.box} material={kit.light} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
import { KnowledgeTower } from './KnowledgeTower';
export { KnowledgeTower };


/* ------------------------------------------------------------------ */
/* 03 Projects — Engineering District                                   */
/* ------------------------------------------------------------------ */

/** Highlights one tower when its project is hovered or open. */
function ProjectTower({ id, children }: { id: ProjectId; children: ReactNode }) {
  const accent = useDisposable(makeAccent);
  const h = useRef(0);
  useFrame((_, dt) => {
    const s = world.get();
    const target = s.active === 'projects' && s.project === id ? 1 : s.hoveredProject === id ? 0.8 : 0;
    h.current += (target - h.current) * damp(dt, 6);
    accent.emissiveIntensity = 0.5 + h.current * 1.6;
  });
  const t = districtTowers[id];
  return (
    <group position={t.offset}>
      <AccentContext.Provider value={accent}>{children}</AccentContext.Provider>
    </group>
  );
}

const { nodes: gNodes, edges: gEdges } = ariaGraph;

/** ARIA: hexagonal tower crowned by a holographic dependency graph. */
function AriaTower() {
  const kit = useKit();
  const accent = useAccent();
  const holo = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.InstancedMesh>(null);
  const hex = useDisposable(() => new THREE.CylinderGeometry(0.5, 0.5, 1, 6));
  const sphere = useDisposable(() => new THREE.IcosahedronGeometry(1, 1));
  const nodeMat = useDisposable(() => new THREE.MeshBasicMaterial({ color: '#ffd9a0', toneMapped: false }));
  const lines = useDisposable(() => {
    const arr = new Float32Array(gEdges.length * 6);
    gEdges.forEach(([a, b], i) => {
      arr.set(gNodes[a].pos, i * 6);
      arr.set(gNodes[b].pos, i * 6 + 3);
    });
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  });
  useFrame((_, delta) => {
    if (holo.current) holo.current.rotation.y += Math.min(delta, 0.05) * 0.3 * kit.q.motion;
  });
  const edges = useMemo(() => {
    const out: Inst[] = [];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      out.push({ p: [Math.sin(a) * 0.66, 3.6, Math.cos(a) * 0.66], s: [0.04, 7, 0.04] });
    }
    return out;
  }, []);
  const instRef = (mesh: THREE.InstancedMesh | null) => {
    nodesRef.current = mesh;
    if (!mesh) return;
    const o = new THREE.Object3D();
    gNodes.forEach((n, i) => {
      o.position.set(...n.pos);
      o.scale.setScalar(n.major ? 0.16 : 0.07);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  return (
    <group>
      <mesh geometry={hex} material={kit.stone} position={[0, 3.6, 0]} scale={[1.5, 7.2, 1.5]} />
      <mesh geometry={hex} material={kit.stone} position={[0, 0.4, 0]} scale={[2.1, 0.8, 2.1]} />
      <InstanceSet items={edges} geometry={kit.box} material={accent} />
      <mesh geometry={hex} material={accent} position={[0, 7.3, 0]} scale={[1.9, 0.12, 1.9]} />
      <group ref={holo} position={[0, 8.6, 0]} scale={0.24}>
        <lineSegments geometry={lines}>
          <lineBasicMaterial color="#e8c58a" transparent opacity={0.55} toneMapped={false} />
        </lineSegments>
        <instancedMesh ref={instRef} args={[sphere, nodeMat, gNodes.length]} />
      </group>
      <sprite position={[0, 8.6, 0]} scale={[4.4, 2.6, 1]}>
        <spriteMaterial map={kit.glowTex} color="#c9a7ff" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </sprite>
    </group>
  );
}

/** DevTrack: stacked dashboard slabs topped with bar-chart columns. */
function DevTrackTower() {
  const kit = useKit();
  const accent = useAccent();
  const slabs = useMemo(() => {
    const out: { y: number; w: number; h: number; d: number; x: number }[] = [];
    let y = 0;
    [1.9, 1.7, 1.55, 1.35, 1.15].forEach((w, i) => {
      const h = 0.95;
      out.push({ y: y + h / 2, w, h, d: w * 0.8, x: i % 2 ? 0.12 : -0.12 });
      y += h + 0.08;
    });
    return { out, top: y };
  }, []);
  return (
    <group>
      {slabs.out.map((s, i) => (
        <group key={i}>
          <mesh geometry={kit.box} material={kit.stone} position={[s.x, s.y, 0]} scale={[s.w, s.h, s.d]} />
          <mesh geometry={kit.box} material={accent} position={[s.x, s.y + s.h / 2 + 0.03, 0]} scale={[s.w + 0.06, 0.05, s.d + 0.06]} />
          <mesh geometry={kit.box} material={kit.light} position={[s.x, s.y, s.d / 2 + 0.01]} scale={[s.w * 0.7, 0.08, 0.01]} />
        </group>
      ))}
      {[0.5, 0.9, 0.7, 1.2].map((bh, i) => (
        <mesh key={i} geometry={kit.box} material={accent} position={[-0.42 + i * 0.28, slabs.top + bh / 2, 0]} scale={[0.18, bh, 0.18]} />
      ))}
    </group>
  );
}

/** Stratify: a stepped ziggurat of ledger blocks with a rotating data cube. */
function StratifyTower() {
  const kit = useKit();
  const accent = useAccent();
  const cube = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (cube.current) {
      const dt = Math.min(delta, 0.05) * kit.q.motion;
      cube.current.rotation.y += dt * 0.6;
      cube.current.rotation.x += dt * 0.25;
    }
  });
  const tiers = [
    { w: 2.3, h: 1.0 },
    { w: 1.8, h: 1.2 },
    { w: 1.3, h: 1.3 },
    { w: 0.85, h: 1.0 },
  ];
  let y = 0;
  return (
    <group>
      {tiers.map((t, i) => {
        const cy = y + t.h / 2;
        y += t.h;
        return (
          <group key={i}>
            <mesh geometry={kit.box} material={kit.stone} position={[0, cy, 0]} scale={[t.w, t.h, t.w]} />
            <mesh geometry={kit.box} material={accent} position={[0, cy + t.h / 2, 0]} scale={[t.w + 0.04, 0.05, t.w + 0.04]} />
            <mesh geometry={kit.box} material={kit.light} position={[0, cy, t.w / 2 + 0.01]} scale={[t.w * 0.18, t.h * 0.6, 0.01]} />
          </group>
        );
      })}
      <group ref={cube} position={[0, y + 0.75, 0]}>
        <mesh geometry={kit.box} scale={0.7}>
          <meshBasicMaterial color="#e8c58a" wireframe toneMapped={false} />
        </mesh>
        <mesh geometry={kit.box} material={accent} scale={0.36} />
      </group>
    </group>
  );
}

/** PhishGuard AI: a guarded vault under a wireframe shield dome with a scanning ring. */
function PhishGuardTower() {
  const kit = useKit();
  const accent = useAccent();
  const scan = useRef<THREE.Mesh>(null);
  const dome = useDisposable(() => new THREE.SphereGeometry(1, 14, 7, 0, Math.PI * 2, 0, Math.PI / 2));
  useFrame(({ clock }) => {
    if (scan.current) {
      const t = clock.elapsedTime * kit.q.motion;
      scan.current.position.y = 1.3 + ((t * 0.45) % 1) * 1.15;
      const k = 1 - ((t * 0.45) % 1);
      scan.current.scale.setScalar(0.35 + Math.sqrt(1 - (1 - k) * (1 - k)) * 0.85);
    }
  });
  return (
    <group>
      <mesh geometry={kit.box} material={kit.stone} position={[0, 0.65, 0]} scale={[1.7, 1.3, 1.7]} />
      <mesh geometry={kit.box} material={kit.light} position={[0, 0.65, 0.86]} scale={[0.5, 0.7, 0.01]} />
      <mesh geometry={dome} position={[0, 1.3, 0]} scale={1.2}>
        <meshBasicMaterial color="#e8c58a" wireframe transparent opacity={0.55} toneMapped={false} />
      </mesh>
      <mesh geometry={dome} material={accent} position={[0, 1.3, 0]} scale={0.55} />
      <mesh ref={scan} rotation-x={Math.PI / 2} position={[0, 1.3, 0]}>
        <torusGeometry args={[1.2, 0.025, 4, 64]} />
        <meshBasicMaterial color="#fff1d6" toneMapped={false} />
      </mesh>
    </group>
  );
}

export function EngineeringDistrict() {
  const kit = useKit();
  const bridges = useMemo<Inst[]>(() => {
    const pairs: [ProjectId, ProjectId, number][] = [
      ['aria', 'devtrack', 4.2],
      ['aria', 'stratify', 3.6],
      ['devtrack', 'phishing', 2.2],
      ['stratify', 'phishing', 2.0],
    ];
    return pairs.map(([a, b, y]) => {
      const pa = districtTowers[a].offset;
      const pb = districtTowers[b].offset;
      const dx = pb[0] - pa[0];
      const dz = pb[2] - pa[2];
      return { p: [(pa[0] + pb[0]) / 2, y, (pa[2] + pb[2]) / 2], s: [0.1, 0.07, Math.hypot(dx, dz)], r: Math.atan2(dx, dz) };
    });
  }, []);
  return (
    <group>
      <mesh geometry={kit.cyl} material={kit.slab} position={[0, 0.08, 0]} scale={[8, 0.16, 8]} />
      <InstanceSet items={bridges} geometry={kit.box} material={kit.light} />
      <ProjectTower id="aria">
        <AriaTower />
      </ProjectTower>
      <ProjectTower id="devtrack">
        <DevTrackTower />
      </ProjectTower>
      <ProjectTower id="stratify">
        <StratifyTower />
      </ProjectTower>
      <ProjectTower id="phishing">
        <PhishGuardTower />
      </ProjectTower>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 04 Experience — Guild Hall                                          */
/* ------------------------------------------------------------------ */

export function GuildHall() {
  const kit = useKit();
  const accent = useAccent();
  const roof = useDisposable(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-2.3, 0);
    shape.lineTo(2.3, 0);
    shape.lineTo(0, 1.05);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false });
    g.translate(0, 0, -1.5);
    return g;
  });
  const columns = useMemo<Inst[]>(
    () => Array.from({ length: 6 }, (_, i) => ({ p: [-1.75 + i * 0.7, 1.75, 1.15], s: [0.26, 2.7, 0.26] })),
    [],
  );
  const caps = useMemo<Inst[]>(() => columns.map((c) => ({ p: [c.p[0], 3.12, c.p[2]], s: [0.4, 0.1, 0.4] })), [columns]);
  const banners = useMemo<Inst[]>(
    () => [-1.4, 1.4].map((x) => ({ p: [x, 2.4, 0.95], s: [0.34, 1.2, 0.02] })),
    [],
  );
  return (
    <group>
      <mesh geometry={kit.box} material={kit.slab} position={[0, 0.2, 0]} scale={[4.9, 0.4, 3.5]} />
      <mesh geometry={kit.box} material={kit.slab} position={[0, 0.44, 0.1]} scale={[4.5, 0.12, 3.1]} />
      <mesh geometry={kit.box} material={kit.stone} position={[0, 1.8, -0.35]} scale={[3.9, 2.7, 2.2]} />
      <InstanceSet items={columns} geometry={kit.cyl} material={kit.stone} />
      <InstanceSet items={caps} geometry={kit.box} material={accent} />
      <mesh geometry={kit.box} material={kit.stone} position={[0, 3.3, 0]} scale={[4.7, 0.3, 3.1]} />
      <mesh geometry={kit.box} material={accent} position={[0, 3.18, 1.56]} scale={[4.6, 0.05, 0.02]} />
      <mesh geometry={roof} material={kit.stone} position={[0, 3.45, 0]} />
      <mesh geometry={kit.box} material={accent} position={[0, 3.9, 1.52]} scale={[0.5, 0.5, 0.02]} rotation-z={Math.PI / 4} />
      {/* Doorway light */}
      <mesh geometry={kit.box} material={kit.light} position={[0, 1.35, 0.76]} scale={[0.9, 1.7, 0.02]} />
      <mesh geometry={kit.plane} material={kit.glow} position={[0, 1.4, 0.9]} scale={[2.4, 2.6, 1]} />
      <InstanceSet items={banners} geometry={kit.box} material={accent} />
      <mesh geometry={kit.cone} material={kit.stone} position={[0, 4.75, 0]} scale={[0.3, 0.8, 0.3]} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 05 Achievements — Hall of Achievements                               */
/* ------------------------------------------------------------------ */

export function HallOfAchievements() {
  const kit = useKit();
  const accent = useAccent();
  const halo = useRef<THREE.Mesh>(null);
  const cup = useDisposable(() => {
    const pts = [
      [0, 0],
      [0.5, 0],
      [0.5, 0.12],
      [0.18, 0.24],
      [0.12, 0.7],
      [0.26, 0.86],
      [0.56, 1.02],
      [0.7, 1.5],
      [0.72, 1.92],
      [0.64, 1.92],
      [0.6, 1.52],
      [0.45, 1.12],
      [0, 1.06],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 32);
  });
  const obelisks = useMemo<Inst[]>(
    () => [0.25, 0.75, 1.25, 1.75].map((k) => ({ p: [Math.cos(k * Math.PI) * 2.6, 2.1, Math.sin(k * Math.PI) * 2.6], s: [0.5, 3.4, 0.5], r: Math.PI / 4 })),
    [],
  );
  const tips = useMemo<Inst[]>(() => obelisks.map((o) => ({ p: [o.p[0], 3.95, o.p[2]], s: [0.14, 0.14, 0.14] })), [obelisks]);
  useFrame((_, delta) => {
    if (halo.current) halo.current.rotation.z += Math.min(delta, 0.05) * 0.4 * kit.q.motion;
  });
  return (
    <group>
      {[
        [4.8, 0.35],
        [3.6, 0.35],
        [2.4, 0.35],
      ].map(([d, hh], i) => (
        <group key={i}>
          <mesh geometry={kit.cyl} material={i === 1 ? kit.stone : kit.slab} position={[0, 0.18 + i * 0.35, 0]} scale={[d, hh, d]} />
          <mesh rotation-x={Math.PI / 2} position={[0, 0.36 + i * 0.35, 0]} material={accent}>
            <torusGeometry args={[d / 2 + 0.02, 0.03, 4, 64]} />
          </mesh>
        </group>
      ))}
      <InstanceSet items={obelisks} geometry={kit.cone} material={kit.stone} />
      <InstanceSet items={tips} geometry={kit.box} material={kit.light} />
      <group position={[0, 1.05, 0]} scale={1.35}>
        <mesh geometry={cup} material={kit.gold} />
        {[-1, 1].map((sx) => (
          <mesh key={sx} material={kit.gold} position={[sx * 0.7, 1.45, 0]} rotation-z={sx * Math.PI / 2}>
            <torusGeometry args={[0.24, 0.05, 6, 16, Math.PI]} />
          </mesh>
        ))}
      </group>
      <mesh ref={halo} position={[0, 4.7, 0]} rotation-x={Math.PI / 2.3} material={accent}>
        <torusGeometry args={[1.1, 0.03, 4, 64]} />
      </mesh>
      <sprite position={[0, 2.8, 0]} scale={[4, 4, 1]}>
        <spriteMaterial map={kit.glowTex} color="#ffc36e" transparent opacity={0.35} blending={THREE.AdditiveBlending} depthWrite={false} fog={false} />
      </sprite>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* 06 Contact — Contact Gateway                                        */
/* ------------------------------------------------------------------ */

export function ContactGateway() {
  const kit = useKit();
  const accent = useAccent();
  const swirl = useRef<THREE.Mesh>(null);
  const signals = useRef<(THREE.Mesh | null)[]>([]);
  const signalMats = useDisposable(
    () => {
      const mats = [0, 1, 2].map(
        () => new THREE.MeshBasicMaterial({ color: '#ffe2b0', transparent: true, opacity: 0, depthWrite: false, toneMapped: false }),
      );
      return Object.assign(mats, { dispose: () => mats.forEach((m) => m.dispose()) });
    },
  );
  useFrame(({ clock }, delta) => {
    const m = kit.q.motion;
    if (swirl.current) swirl.current.rotation.z -= Math.min(delta, 0.05) * 0.8 * m;
    const t = clock.elapsedTime;
    signals.current.forEach((mesh, i) => {
      if (!mesh) return;
      const k = m ? (t * 0.4 + i / 3) % 1 : 0.4 + i * 0.2;
      mesh.scale.setScalar(0.4 + k * 2.6);
      signalMats[i].opacity = (1 - k) * 0.7;
    });
  });
  return (
    <group>
      <mesh geometry={kit.box} material={kit.slab} position={[0, 0.2, 0]} scale={[3.2, 0.4, 1.6]} />
      <mesh geometry={kit.box} material={kit.stone} position={[0, 0.55, 0]} scale={[2.4, 0.3, 1.0]} />
      <mesh position={[0, 2.35, 0]} material={accent}>
        <torusGeometry args={[1.55, 0.17, 12, 64]} />
      </mesh>
      <mesh position={[0, 2.35, 0]} material={kit.stone}>
        <torusGeometry args={[1.8, 0.1, 8, 64]} />
      </mesh>
      <mesh position={[0, 2.35, -0.02]}>
        <circleGeometry args={[1.42, 48]} />
        <meshBasicMaterial map={kit.glowTex} color="#ffb866" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <mesh ref={swirl} position={[0, 2.35, 0.02]}>
        <torusGeometry args={[0.9, 0.02, 4, 48, Math.PI * 1.4]} />
        <meshBasicMaterial color="#fff1d6" toneMapped={false} />
      </mesh>
      {/* Beacon with expanding signal rings */}
      <mesh geometry={kit.cyl} material={kit.stone} position={[2.0, 1.9, -0.2]} scale={[0.12, 3.4, 0.12]} />
      <mesh position={[2.0, 3.7, -0.2]}>
        <sphereGeometry args={[0.14, 12, 8]} />
        <meshBasicMaterial color="#fff1d6" toneMapped={false} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => {
            signals.current[i] = el;
          }}
          position={[2.0, 3.7, -0.2]}
          material={signalMats[i]}
        >
          <torusGeometry args={[0.3, 0.012, 4, 48]} />
        </mesh>
      ))}
    </group>
  );
}

export const buildings: Record<LandmarkDef['id'], () => JSX.Element> = {
  home: CentralPortal,
  about: KnowledgeTower,
  projects: EngineeringDistrict,
  experience: GuildHall,
  achievements: HallOfAchievements,
  contact: ContactGateway,
};
