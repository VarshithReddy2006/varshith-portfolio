/**
 * Atmosphere around the landmarks: shader sky, ringed planet, distant
 * skyline, cloud sea, embers, golden paths and the foreground platform.
 */
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mulberry32 } from '../../components/three/procedural';
import { bobY, getLandmark, landmarks, type LandmarkId } from '../landmarks';
import { world } from '../store';
import { runtime } from '../journey';
import { buildDistant, buildRock } from './builders';
import { InstanceSet, useDisposable, useKit } from './kit';

export const SUN_DIR = new THREE.Vector3(0.04, 0.12, -1).normalize();
const GOLD = '#e8c58a';

/* ------------------------------------------------------------------ */
/* Sky & Atmospheric Scattering                                       */
/* ------------------------------------------------------------------ */

const skyVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragment = /* glsl */ `
  uniform vec3 uSun;
  uniform float uTime;
  varying vec3 vDir;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.03; a *= 0.5; }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);
    float h = d.y;

    // Cinematic twilight golden hour atmosphere - deep, rich and balanced
    vec3 zenith = vec3(0.016, 0.022, 0.042);    // deep twilight indigo
    vec3 upper = vec3(0.11, 0.08, 0.10);        // dusty mauve dusk
    vec3 mid = vec3(0.30, 0.17, 0.12);          // warm terra-cotta
    vec3 horizon = vec3(0.55, 0.34, 0.17);      // soft warm amber gold
    vec3 nadir = vec3(0.05, 0.04, 0.035);       // deep warm shadow below

    vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.12, h));
    col = mix(col, upper, smoothstep(0.12, 0.38, h));
    col = mix(col, zenith, smoothstep(0.38, 0.78, h));
    col = mix(col, nadir, smoothstep(0.0, -0.22, h));

    // Controlled, elegant sun disc and tight halo (no broad blowout wash)
    float s = max(dot(d, uSun), 0.0);
    vec3 sunDisc = vec3(1.0, 0.88, 0.62) * pow(s, 900.0) * 1.4;
    vec3 sunHalo = vec3(0.85, 0.46, 0.16) * (pow(s, 28.0) * 0.18 + pow(s, 140.0) * 0.32);
    col += sunDisc + sunHalo;

    // Atmospheric warm horizon glow band (subtle and balanced)
    float horizonGlow = exp(-abs(h - 0.02) * 18.0) * 0.12;
    col += vec3(0.85, 0.52, 0.22) * horizonGlow;

    // High-altitude drifting cirrus & cumulus cloud formations
    vec2 uv = vec2(atan(d.x, -d.z) * 3.5, h * 14.0);
    float n = fbm(uv * vec2(1.1, 0.8) + vec2(uTime * 0.003, 0.0));
    float n2 = fbm(uv * vec2(2.4, 1.5) - vec2(uTime * 0.005, 2.7));
    float band = smoothstep(-0.06, 0.08, h) * (1.0 - smoothstep(0.28, 0.68, h));
    float cloud = smoothstep(0.38, 0.85, n * 0.68 + n2 * 0.42) * band;

    vec3 cloudShade = vec3(0.10, 0.08, 0.07);
    vec3 cloudLit = mix(cloudShade, vec3(0.82, 0.58, 0.32), pow(s, 3.5) * 0.85 + 0.10);
    col = mix(col, cloudLit, cloud * 0.75);

    // Subtle star field in zenith twilight
    vec2 g = floor(vec2(atan(d.x, -d.z), asin(clamp(h, -1.0, 1.0))) * 850.0);
    col += step(0.9982, hash(g)) * smoothstep(0.32, 0.65, h) * 0.6;

    // Dither to prevent banding
    col += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;

export function Sky() {
  const { q } = useKit();
  const mat = useDisposable(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: skyVertex,
        fragmentShader: skyFragment,
        uniforms: { uSun: { value: SUN_DIR }, uTime: { value: 0 } },
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
      }),
  );
  useFrame(({ clock }) => {
    mat.uniforms.uTime.value = clock.elapsedTime * q.motion;
  });
  return (
    <mesh material={mat} renderOrder={-1}>
      <sphereGeometry args={[500, 48, 24]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Volumetric Sun Light Shafts (God Rays)                             */
/* ------------------------------------------------------------------ */

export function SunGodRays() {
  const { q } = useKit();
  const group = useRef<THREE.Group>(null);
  const rays = useMemo(() => {
    return [-0.35, -0.22, -0.09, 0.05, 0.18, 0.32].map((angle, i) => ({
      angle,
      width: 12 + (i % 3) * 4,
      length: 160 + (i % 2) * 30,
      opacity: 0.018 + (i % 2) * 0.012,
      speed: 0.12 + (i * 0.05),
    }));
  }, []);

  useFrame(({ clock }) => {
    if (!group.current || !q.motion) return;
    const t = clock.elapsedTime;
    group.current.rotation.z = Math.sin(t * 0.04) * 0.03;
  });

  return (
    <group ref={group} position={[15, 30, -140]} rotation={[0.2, 0.05, -0.15]}>
      {rays.map((r, i) => (
        <mesh key={i} rotation={[0, 0, r.angle]} position={[0, -r.length / 2, 0]}>
          <planeGeometry args={[r.width, r.length]} />
          <meshBasicMaterial
            color="#e2a868"
            transparent
            opacity={r.opacity}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Wildlife: Flock of Soaring Sky Birds                                */
/* ------------------------------------------------------------------ */

export function FlockOfBirds() {
  const { q } = useKit();
  const count = 20;
  const group = useRef<THREE.Group>(null);
  const meshes = useRef<THREE.Mesh[]>([]);

  const birds = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      offset: i * 0.32,
      spreadX: ((i % 5) - 2) * 2.8,
      spreadY: (Math.floor(i / 5) - 2) * 1.6,
      spreadZ: ((i % 3) - 1) * 3.5,
      flapSpeed: 4.5 + (i % 4) * 0.8,
      scale: 0.35 + (i % 3) * 0.12,
    }));
  }, []);

  const wingGeo = useDisposable(() => {
    // V-shaped wing silhouette
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(1.2, 0.4);
    shape.lineTo(0.9, -0.1);
    shape.lineTo(0, -0.05);
    shape.lineTo(-0.9, -0.1);
    shape.lineTo(-1.2, 0.4);
    shape.closePath();
    return new THREE.ShapeGeometry(shape);
  });

  const birdMat = useDisposable(
    () =>
      new THREE.MeshBasicMaterial({
        color: '#2a221a',
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
  );

  useFrame(({ clock }) => {
    if (!group.current || !q.motion) return;
    const t = clock.elapsedTime * 0.18;

    // Majestic figure-8 swooping path across the sky
    const pathX = Math.sin(t) * 75;
    const pathY = 16 + Math.sin(t * 2) * 8;
    const pathZ = -45 + Math.cos(t) * 45;

    group.current.position.set(pathX, pathY, pathZ);
    // Orient flock along flight tangent
    const dx = Math.cos(t) * 75;
    const dy = Math.cos(t * 2) * 16;
    const dz = -Math.sin(t) * 45;
    group.current.rotation.x = -Math.atan2(dy, Math.hypot(dx, dz)) * 0.25;
    group.current.rotation.y = Math.atan2(dx, dz);
    group.current.rotation.z = -Math.sin(t) * 0.25; // banking into turns

    // Procedural wing flapping for each bird
    meshes.current.forEach((mesh, i) => {
      if (!mesh) return;
      const b = birds[i];
      const flap = Math.sin(clock.elapsedTime * b.flapSpeed + b.offset * 6) * 0.4;
      mesh.rotation.x = flap;
    });
  });

  return (
    <group ref={group}>
      {birds.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) meshes.current[i] = el;
          }}
          geometry={wingGeo}
          material={birdMat}
          position={[b.spreadX, b.spreadY, b.spreadZ]}
          scale={b.scale}
          rotation-x={Math.PI / 2}
        />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Celestial objects                                                   */
/* ------------------------------------------------------------------ */

/** Large ringed planet hanging above the portal, back-lit by the sun. */
export function Planet() {
  const { glowTex, q } = useKit();
  const ring = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.z += Math.min(dt, 0.05) * 0.01 * q.motion;
  });
  return (
    <group position={[2, 40, -150]}>
      <sprite scale={[45, 45, 1]}>
        <spriteMaterial map={glowTex} color="#ff9f4a" transparent opacity={0.06} depthWrite={false} fog={false} blending={THREE.AdditiveBlending} />
      </sprite>
      <mesh>
        <sphereGeometry args={[19, 48, 32]} />
        <meshStandardMaterial color="#2a2420" roughness={0.9} emissive="#1a120a" fog={false} />
      </mesh>
      <group ref={ring} rotation={[1.25, 0.18, 0.12]}>
        <mesh>
          <torusGeometry args={[31, 0.5, 6, 160]} />
          <meshBasicMaterial color={GOLD} transparent opacity={0.45} fog={false} toneMapped={false} />
        </mesh>
        <mesh>
          <torusGeometry args={[36, 2.6, 2, 160]} />
          <meshBasicMaterial color="#8a6a43" transparent opacity={0.18} fog={false} depthWrite={false} />
        </mesh>
      </group>
      {/* Small moon to the right */}
      <mesh position={[62, -40, 30]}>
        <sphereGeometry args={[5, 32, 20]} />
        <meshStandardMaterial color="#3a332c" roughness={0.95} fog={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Distant skyline and floating debris                                 */
/* ------------------------------------------------------------------ */

export function Distant() {
  const kit = useKit();
  const d = useMemo(() => buildDistant(kit.q.distant), [kit.q.distant]);
  const rockGeo = useDisposable(() => buildRock(1, 1.4, 777, 12));
  const mountainGeo = useDisposable(() => new THREE.ConeGeometry(0.7, 1, 4));

  // Soft atmospheric mountain material tinted with golden dusk haze
  const mountainMat = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#26201b',
        roughness: 0.94,
        metalness: 0.05,
      }),
  );

  return (
    <group>
      <InstanceSet items={d.ridges} geometry={mountainGeo} material={mountainMat} />
      <InstanceSet items={d.glows} geometry={kit.plane} material={kit.glowFog} />
      <InstanceSet items={d.rocks} geometry={rockGeo} material={kit.rock} />
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Clouds                                                              */
/* ------------------------------------------------------------------ */

interface CloudCfg {
  count: number;
  seed: number;
  y: [number, number];
  z: [number, number];
  w: [number, number];
  opacity: number;
  speed: number;
}

/** Camera-facing cloud billboards that drift slowly and wrap around. */
function CloudLayer({ cfg }: { cfg: CloudCfg }) {
  const kit = useKit();
  const ref = useRef<THREE.InstancedMesh>(null);
  const data = useMemo(() => {
    const rnd = mulberry32(cfg.seed);
    return Array.from({ length: cfg.count }, () => {
      const z = cfg.z[0] + rnd() * (cfg.z[1] - cfg.z[0]);
      const span = 40 + (40 - z) * 0.9;
      const w = cfg.w[0] + rnd() * (cfg.w[1] - cfg.w[0]);
      return {
        x: (rnd() * 2 - 1) * span,
        y: cfg.y[0] + rnd() * (cfg.y[1] - cfg.y[0]),
        z,
        w,
        h: w * (0.38 + rnd() * 0.14),
        span,
        speed: cfg.speed * (0.5 + rnd()),
        warm: 0.4 + rnd() * 0.6,
      };
    });
  }, [cfg]);
  const material = useDisposable(
    () => new THREE.MeshBasicMaterial({ map: kit.cloudTex, transparent: true, opacity: cfg.opacity, depthWrite: false }),
    [kit, cfg.opacity],
  );

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const shade = new THREE.Color('#4f453c');
    const lit = new THREE.Color('#cf9a60');
    const c = new THREE.Color();
    data.forEach((d, i) => {
      const nearSun = Math.exp(-Math.pow(d.x / (d.span * 0.45), 2));
      c.copy(shade).lerp(lit, Math.min(1, nearSun * d.warm * 1.3));
      mesh.setColorAt(i, c);
    });
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [data]);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ camera }, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const dt = Math.min(delta, 0.05) * kit.q.motion;
    data.forEach((d, i) => {
      d.x += d.speed * dt;
      if (d.x > d.span) d.x = -d.span;
      dummy.position.set(d.x, d.y, d.z);
      // Billboards only yaw toward the camera so cloud banks stay level.
      dummy.rotation.set(0, Math.atan2(camera.position.x - d.x, camera.position.z - d.z), 0);
      dummy.scale.set(d.w, d.h, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[kit.plane, material, cfg.count]} frustumCulled={false} />;
}

export function Clouds() {
  const { q } = useKit();
  const sea = useMemo<CloudCfg>(
    () => ({ count: q.clouds, seed: 5, y: [-16, -10], z: [-170, 34], w: [16, 42], opacity: 0.55, speed: 0.35 }),
    [q.clouds],
  );
  const wisps = useMemo<CloudCfg>(
    () => ({ count: Math.round(q.clouds * 0.22), seed: 9, y: [-3, 10], z: [-110, -36], w: [10, 24], opacity: 0.18, speed: 0.6 }),
    [q.clouds],
  );
  return (
    <>
      <CloudLayer cfg={sea} />
      <CloudLayer cfg={wisps} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Embers                                                              */
/* ------------------------------------------------------------------ */

export function Embers() {
  const kit = useKit();
  const count = kit.q.embers;
  const geo = useDisposable(() => {
    const rnd = mulberry32(31);
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (rnd() - 0.5) * 80;
      arr[i * 3 + 1] = -8 + rnd() * 26;
      arr[i * 3 + 2] = -45 + rnd() * 70;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    return g;
  }, [count]);
  const speeds = useMemo(() => {
    const rnd = mulberry32(32);
    return Float32Array.from({ length: count }, () => 0.15 + rnd() * 0.45);
  }, [count]);
  useFrame(({ clock }, delta) => {
    if (!kit.q.motion) return;
    const dt = Math.min(delta, 0.05);
    const attr = geo.attributes.position as THREE.BufferAttribute;
    const a = attr.array as Float32Array;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      a[i * 3 + 1] += speeds[i] * dt;
      a[i * 3] += Math.sin(t * 0.5 + i) * dt * 0.08;
      if (a[i * 3 + 1] > 18) a[i * 3 + 1] = -8;
    }
    attr.needsUpdate = true;
  });
  return (
    <points geometry={geo}>
      <pointsMaterial
        map={kit.glowTex}
        color="#ffcf8a"
        size={0.16}
        sizeAttenuation
        transparent
        opacity={0.7}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        fog={true}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Golden paths                                                        */
/* ------------------------------------------------------------------ */

function pathCurve(id: LandmarkId) {
  const home = getLandmark('home').island;
  const l = getLandmark(id).island;
  const a = new THREE.Vector3(...home.pos);
  const b = new THREE.Vector3(...l.pos);
  const dir = b.clone().sub(a).setY(0).normalize();
  const start = a.clone().addScaledVector(dir, home.r * 0.92).setY(home.pos[1] + 0.05);
  const end = b.clone().addScaledVector(dir, -l.r * 0.92).setY(l.pos[1] + 0.05);
  const side = new THREE.Vector3(-dir.z, 0, dir.x);
  const mid = start.clone().lerp(end, 0.5);
  // Paths sag below the islands and sweep sideways, like light bridges.
  mid.y = Math.min(start.y, end.y) - 3.2;
  mid.addScaledVector(side, (id.length % 2 ? 1 : -1) * 3);
  const m1 = start.clone().lerp(mid, 0.5).setY((start.y + mid.y) / 2 - 0.6);
  const m2 = mid.clone().lerp(end, 0.5).setY((mid.y + end.y) / 2 - 0.6);
  return new THREE.CatmullRomCurve3([start, m1, mid, m2, end]);
}

interface PathRuntime {
  id: LandmarkId;
  curve: THREE.CatmullRomCurve3;
  core: THREE.MeshBasicMaterial;
  halo: THREE.MeshBasicMaterial;
  h: number;
}

/** Glowing light bridges from the central island to every landmark, with travelling pulses. */
export function GoldenPaths() {
  const kit = useKit();
  const paths = useMemo<PathRuntime[]>(
    () =>
      landmarks
        .filter((l) => l.id !== 'home')
        .map((l) => ({
          id: l.id,
          curve: pathCurve(l.id),
          core: new THREE.MeshBasicMaterial({ color: '#f2c786', toneMapped: false, transparent: true, opacity: 0.85 }),
          halo: new THREE.MeshBasicMaterial({
            color: '#ffb866',
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
          }),
          h: 0,
        })),
    [],
  );
  const geos = useMemo(
    () =>
      paths.map((p) => ({
        core: new THREE.TubeGeometry(p.curve, 80, 0.06, 5, false),
        halo: new THREE.TubeGeometry(p.curve, 60, 0.3, 6, false),
      })),
    [paths],
  );
  const pulses = useDisposable(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(paths.length * 3 * 3), 3));
    return g;
  }, [paths]);
  useEffect(
    () => () => {
      paths.forEach((p) => (p.core.dispose(), p.halo.dispose()));
      geos.forEach((g) => (g.core.dispose(), g.halo.dispose()));
    },
    [paths, geos],
  );

  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }, delta) => {
    const s = world.get();
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * 6);
    const attr = pulses.attributes.position as THREE.BufferAttribute;
    const t = clock.elapsedTime * (kit.q.motion ? 1 : 0);
    paths.forEach((p, i) => {
      const target = s.active === p.id ? 1 : s.hovered === p.id ? 0.7 : 0;
      p.h += (target - p.h) * k;
      p.core.color.setRGB(0.95 + p.h * 0.05, 0.72 + p.h * 0.2, 0.45 + p.h * 0.35);
      // Connections fade in as the world reveals itself during the journey.
      const r = 0.15 + 0.85 * runtime.reveal;
      p.core.opacity = 0.85 * r;
      p.halo.opacity = (0.1 + p.h * 0.28) * r;
      for (let j = 0; j < 3; j++) {
        const u = (t * (0.07 + p.h * 0.05) + j / 3 + i * 0.13) % 1;
        p.curve.getPointAt(u, v);
        attr.setXYZ(i * 3 + j, v.x, v.y, v.z);
      }
    });
    attr.needsUpdate = true;
  });

  return (
    <group>
      {paths.map((p, i) => (
        <group key={p.id}>
          <mesh geometry={geos[i].core} material={p.core} />
          <mesh geometry={geos[i].halo} material={p.halo} />
        </group>
      ))}
      <points geometry={pulses}>
        <pointsMaterial
          map={kit.glowTex}
          color="#fff1d6"
          size={0.9}
          sizeAttenuation
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </points>
    </group>
  );
}

/** Sweeping elliptical light ring around the central island (as in the reference). */
export function OrbitRing() {
  const home = getLandmark('home').island;
  const ref = useRef<THREE.Group>(null);
  const { q } = useKit();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.position.y = home.pos[1] - 1.4 + bobY(home, clock.elapsedTime * q.motion);
    ref.current.rotation.y += 0.0008 * q.motion;
  });
  return (
    <group ref={ref} position={[home.pos[0], home.pos[1] - 1.4, home.pos[2]]} rotation={[0.08, 0, 0.04]}>
      <mesh rotation-x={Math.PI / 2} scale={[1.55, 1, 1]}>
        <torusGeometry args={[8.2, 0.05, 4, 160]} />
        <meshBasicMaterial color="#f2c786" toneMapped={false} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} scale={[1.55, 1, 1]}>
        <torusGeometry args={[8.2, 0.32, 4, 120]} />
        <meshBasicMaterial color="#ffb866" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}
