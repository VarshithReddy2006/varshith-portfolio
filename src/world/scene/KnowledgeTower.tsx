/**
 * 02 About — Knowledge Tower
 *
 * Polish Pass 03: Premium Fantasy Architecture
 * - Monumental celestial Gothic library / magical observatory
 * - Continuous, sculpted architectural silhouette with tapered setbacks and sloped stone roofs
 * - Distinctive central Gothic spire with tall, uninterrupted vertical profile
 * - Deeply recessed cathedral portal and narrow lancet window niches with pointed arch heads
 * - Restrained, sophisticated lighting: ultra-narrow stained-glass amber slits inside dark embrasures
 * - Open celestial belfry / lantern revealing glowing core through skeletal Gothic arches
 * - Structurally integrated secondary spires with arched flying buttress bridges
 * - Mechanically precise astronomical armillary crown with restrained celestial radiance
 * - Layered stone and bronze foundation plinth with radial anchored buttress spurs
 */
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDisposable, useKit } from './kit';

const PALETTE = {
  primaryStructure: '#15100d', // Deep rich charcoal bronze
  secondaryStructure: '#241710', // Dark warm architectural bronze
  accentStructure: '#352216', // Mid warm bronze for pilasters and jambs
  architecturalTrim: '#c89748', // Antique champagne gold
  edgeHighlight: '#f3d69c', // Pale luminous champagne gold
  lightChannel: '#ffae42', // Warm amber slit illumination
  lightCore: '#ffe094', // Luminous celestial gold core
};

/* ------------------------------------------------------------------ */
/* Procedural Geometry Generators                                     */
/* ------------------------------------------------------------------ */

/** Creates a 4-sided steep tapered pyramid cap (rotated 45 deg for square alignment) */
function createPyramidGeometry(baseWidth: number, height: number, segments = 4): THREE.BufferGeometry {
  const radius = baseWidth / (segments === 4 ? Math.SQRT2 : 2);
  const geo = new THREE.CylinderGeometry(0.015, radius, height, segments, 1, false);
  if (segments === 4) {
    geo.rotateY(Math.PI / 4);
  }
  geo.translate(0, height / 2, 0);
  return geo;
}

/** Creates an 8-sided tapered needle spire for high Gothic finials */
function createOctagonalSpireGeometry(baseWidth: number, height: number): THREE.BufferGeometry {
  const radius = baseWidth / 1.84;
  const geo = new THREE.CylinderGeometry(0.012, radius, height, 8, 1, false);
  geo.translate(0, height / 2, 0);
  return geo;
}

/** Creates a sloped trapezoidal / pyramidal roof weathering bridging tier setbacks */
function createSlopedRoofGeometry(bottomWidth: number, topWidth: number, height: number): THREE.BufferGeometry {
  const rTop = topWidth / Math.SQRT2;
  const rBottom = bottomWidth / Math.SQRT2;
  const geo = new THREE.CylinderGeometry(rTop, rBottom, height, 4, 1, false);
  geo.rotateY(Math.PI / 4);
  geo.translate(0, height / 2, 0);
  return geo;
}

/** Creates an authentic pointed Gothic gable / arch crown with curved shoulders */
function createGothicGableGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const w2 = width / 2;
  const hJamb = height * 0.42;
  shape.moveTo(-w2, 0);
  shape.lineTo(-w2, hJamb);
  shape.quadraticCurveTo(-w2 * 0.38, hJamb + (height - hJamb) * 0.65, 0, height);
  shape.quadraticCurveTo(w2 * 0.38, hJamb + (height - hJamb) * 0.65, w2, hJamb);
  shape.lineTo(w2, 0);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 1,
    bevelSize: 0.008,
    bevelThickness: 0.008,
  });
  geo.center();
  return geo;
}

/** Creates a stepped circular foundation plinth */
function createPlinthGeometry(radius: number, height: number, segments = 28): THREE.BufferGeometry {
  const geo = new THREE.CylinderGeometry(radius * 0.985, radius, height, segments, 1, false);
  geo.translate(0, height / 2, 0);
  return geo;
}

/** Thin decorative horizontal gold trim rim for plinths and cornices */
function createTrimRingGeometry(radius: number, tubeRadius = 0.024, segments = 48): THREE.BufferGeometry {
  const geo = new THREE.TorusGeometry(radius, tubeRadius, 4, segments);
  geo.rotateX(Math.PI / 2);
  return geo;
}

/** Arched curved mechanical support strut for the celestial crown cradle */
function createStrutGeometry(): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(-0.032, 0);
  shape.lineTo(0.032, 0);
  shape.lineTo(0.022, 0.76);
  shape.lineTo(-0.022, 0.76);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.036,
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.007,
    bevelThickness: 0.007,
  });
  geo.center();
  return geo;
}

/* ------------------------------------------------------------------ */
/* Subcomponent: ShadowGapCornice                                     */
/* ------------------------------------------------------------------ */

interface CorniceProps {
  position: [number, number, number];
  size: [number, number, number]; // [width, height, depth]
  projection?: number;
  primaryMat: THREE.Material;
  trimMat: THREE.Material;
  edgeMat: THREE.Material;
}

export function ShadowGapCornice({
  position,
  size,
  projection = 0.08,
  primaryMat,
  trimMat,
  edgeMat,
}: CorniceProps) {
  const [w, h, d] = size;
  const shadowH = 0.026;
  const corniceH = Math.max(0.02, h - shadowH);

  return (
    <group position={position}>
      {/* 1. Recessed dark charcoal shadow gap right under the projecting cornice */}
      <mesh material={primaryMat} position={[0, shadowH / 2, 0]}>
        <boxGeometry args={[w * 0.93, shadowH, d * 0.93]} />
      </mesh>

      {/* 2. Projecting antique champagne gold cornice molding */}
      <mesh material={trimMat} position={[0, shadowH + corniceH / 2, 0]}>
        <boxGeometry args={[w + projection, corniceH, d + projection]} />
      </mesh>

      {/* 3. Pale champagne gold contour edge highlight */}
      <mesh material={edgeMat} position={[0, h + 0.005, 0]}>
        <boxGeometry args={[(w + projection) * 1.025, 0.012, (d + projection) * 1.025]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponent: GrandCathedralPortal                                 */
/* ------------------------------------------------------------------ */

interface GrandCathedralPortalProps {
  position: [number, number, number];
  width: number;
  height: number;
  primaryMat: THREE.Material;
  secondaryMat: THREE.Material;
  trimMat: THREE.Material;
  edgeMat: THREE.Material;
  lightMat: THREE.Material;
}

export function GrandCathedralPortal({
  position,
  width,
  height,
  primaryMat,
  secondaryMat,
  trimMat,
  edgeMat,
  lightMat,
}: GrandCathedralPortalProps) {
  const portalArchGeo = useDisposable(() => createGothicGableGeometry(width, height * 0.42, 0.08), [width, height]);
  const innerArchGeo = useDisposable(() => createGothicGableGeometry(width * 0.76, height * 0.34, 0.06), [width, height]);

  const jambW = width * 0.14;
  const jambH = height * 0.62;
  const revealD = 0.09;
  const slitW = 0.042; // Delicate narrow stained-glass slit
  const slitH = height * 0.50;

  return (
    <group position={position}>
      {/* 1. Deep Recessed Charcoal Embrasured Portal Wall */}
      <mesh material={primaryMat} position={[0, 0, -revealD * 0.45]}>
        <boxGeometry args={[width, height, revealD * 0.6]} />
      </mesh>

      {/* 2. Outer Gothic Archivolt Pilaster Columns */}
      <mesh material={secondaryMat} position={[-width / 2 + jambW / 2, -height * 0.12, revealD * 0.15]}>
        <boxGeometry args={[jambW, jambH, revealD * 0.8]} />
      </mesh>
      <mesh material={secondaryMat} position={[width / 2 - jambW / 2, -height * 0.12, revealD * 0.15]}>
        <boxGeometry args={[jambW, jambH, revealD * 0.8]} />
      </mesh>

      {/* 3. Outer Pointed Gable Tympanum Crown */}
      <group position={[0, height / 2 - height * 0.18, revealD * 0.2]}>
        <mesh geometry={portalArchGeo} material={trimMat} />
        <mesh material={edgeMat} position={[0, height * 0.12, 0]}>
          <boxGeometry args={[width * 1.04, 0.015, revealD * 0.9]} />
        </mesh>
      </group>

      {/* 4. Inner Recessed Arch Reveal */}
      <group position={[0, height / 2 - height * 0.24, -revealD * 0.1]}>
        <mesh geometry={innerArchGeo} material={secondaryMat} />
      </group>

      {/* 5. Central Trumeau Column dividing the lancets */}
      <mesh material={trimMat} position={[0, -height * 0.10, revealD * 0.05]}>
        <boxGeometry args={[0.045, slitH + 0.12, revealD * 0.6]} />
      </mesh>
      <mesh material={edgeMat} position={[0, -height * 0.10, revealD * 0.28]}>
        <boxGeometry args={[0.018, slitH + 0.12, 0.012]} />
      </mesh>

      {/* 6. Dual Ultra-Narrow Stained-Glass Celestial Slits (Subtle, deeply inset warm amber) */}
      <group position={[-width * 0.20, -height * 0.10, -revealD * 0.15]}>
        <mesh material={primaryMat}>
          <boxGeometry args={[slitW + 0.02, slitH + 0.03, revealD * 0.3]} />
        </mesh>
        <mesh material={lightMat} position={[0, 0, 0.015]}>
          <boxGeometry args={[slitW, slitH, revealD * 0.25]} />
        </mesh>
      </group>
      <group position={[width * 0.20, -height * 0.10, -revealD * 0.15]}>
        <mesh material={primaryMat}>
          <boxGeometry args={[slitW + 0.02, slitH + 0.03, revealD * 0.3]} />
        </mesh>
        <mesh material={lightMat} position={[0, 0, 0.015]}>
          <boxGeometry args={[slitW, slitH, revealD * 0.25]} />
        </mesh>
      </group>

      {/* 7. Stepped Entrance Plinth / Sill */}
      <mesh material={trimMat} position={[0, -height / 2 + 0.02, revealD * 0.3]}>
        <boxGeometry args={[width * 1.08, 0.04, revealD * 1.2]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponent: GothicLancetNiche                                    */
/* ------------------------------------------------------------------ */

interface GothicLancetNicheProps {
  position: [number, number, number];
  width: number;
  height: number;
  rotationY?: number;
  archGeo?: THREE.BufferGeometry;
  primaryMat: THREE.Material;
  secondaryMat: THREE.Material;
  trimMat: THREE.Material;
  edgeMat: THREE.Material;
  lightMat: THREE.Material;
  hasLight?: boolean;
}

export function GothicLancetNiche({
  position,
  width,
  height,
  rotationY = 0,
  archGeo,
  primaryMat,
  secondaryMat,
  trimMat,
  edgeMat,
  lightMat,
  hasLight = true,
}: GothicLancetNicheProps) {
  const jambW = Math.max(0.035, width * 0.18);
  const revealD = 0.06;
  const lightW = Math.max(0.032, width * 0.16); // Ultra-narrow restrained light slit
  const lightH = height * 0.65;

  return (
    <group position={position} rotation-y={rotationY}>
      {/* 1. Recessed dark bronze embrasure backplate */}
      <mesh material={primaryMat} position={[0, 0, -revealD * 0.45]}>
        <boxGeometry args={[width, height, revealD * 0.5]} />
      </mesh>

      {/* 2. Left and Right projecting bronze pilaster jambs creating real shadow depth */}
      <mesh material={secondaryMat} position={[-width / 2 + jambW / 2, 0, revealD * 0.15]}>
        <boxGeometry args={[jambW, height, revealD * 0.7]} />
      </mesh>
      <mesh material={secondaryMat} position={[width / 2 - jambW / 2, 0, revealD * 0.15]}>
        <boxGeometry args={[jambW, height, revealD * 0.7]} />
      </mesh>

      {/* 3. Deeply inset narrow warm amber light slit with dark reveal borders */}
      {hasLight && (
        <group position={[0, -height * 0.05, -revealD * 0.05]}>
          <mesh material={primaryMat}>
            <boxGeometry args={[lightW + 0.02, lightH + 0.03, revealD * 0.25]} />
          </mesh>
          <mesh material={lightMat} position={[0, 0, revealD * 0.04]}>
            <boxGeometry args={[lightW, lightH, revealD * 0.28]} />
          </mesh>
        </group>
      )}

      {/* 4. Pointed Gothic Arch Head */}
      {archGeo && (
        <group position={[0, height / 2 + 0.05, revealD * 0.15]}>
          <mesh geometry={archGeo} material={trimMat} scale={[width * 1.02, 0.18, revealD * 0.9]} />
          <mesh material={edgeMat} position={[0, 0.075, 0]}>
            <boxGeometry args={[width * 1.05, 0.012, revealD * 0.95]} />
          </mesh>
        </group>
      )}

      {/* 5. Molded stone sill shelf */}
      <mesh material={trimMat} position={[0, -height / 2 - 0.015, revealD * 0.2]}>
        <boxGeometry args={[width * 1.10, 0.03, revealD * 1.1]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponent: FlyingArch                                           */
/* ------------------------------------------------------------------ */

interface FlyingArchProps {
  start: [number, number, number];
  end: [number, number, number];
  thickness?: number;
  rise?: number;
  trimMat: THREE.Material;
  edgeMat: THREE.Material;
  secondaryMat: THREE.Material;
}

export function FlyingArch({
  start,
  end,
  thickness = 0.045,
  rise = 0.20,
  trimMat,
  edgeMat,
  secondaryMat,
}: FlyingArchProps) {
  const p1 = useMemo(() => new THREE.Vector3(...start), [start]);
  const p2 = useMemo(() => new THREE.Vector3(...end), [end]);
  const chord = useMemo(() => p1.distanceTo(p2), [p1, p2]);
  const mid = useMemo(() => new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5), [p1, p2]);

  const rot = useMemo(() => {
    const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    return new THREE.Euler().setFromQuaternion(quat);
  }, [p1, p2]);

  return (
    <group position={[mid.x, mid.y, mid.z]} rotation={[rot.x, rot.y, rot.z]}>
      {/* 1. Upper sloped flyer beam */}
      <mesh material={trimMat} position={[0, rise * 0.32, 0]}>
        <boxGeometry args={[thickness, chord, thickness * 1.6]} />
      </mesh>
      <mesh material={edgeMat} position={[0, rise * 0.32, thickness * 0.85]}>
        <boxGeometry args={[thickness * 1.2, chord * 1.01, 0.012]} />
      </mesh>

      {/* 2. Lower curved masonry arch support forming open negative space */}
      <mesh material={secondaryMat} position={[0, -rise * 0.22, 0]}>
        <boxGeometry args={[thickness * 0.85, chord * 0.84, thickness * 1.2]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponent: TowerFoundation                                      */
/* ------------------------------------------------------------------ */

interface FoundationProps {
  primaryMat: THREE.Material;
  secondaryMat: THREE.Material;
  trimMat: THREE.Material;
  edgeMat: THREE.Material;
  lightMat: THREE.Material;
}

export function TowerFoundation({ primaryMat, secondaryMat, trimMat, edgeMat, lightMat }: FoundationProps) {
  const tier0Geo = useDisposable(() => createPlinthGeometry(3.40, 0.16, 32));
  const tier1Geo = useDisposable(() => createPlinthGeometry(2.86, 0.22, 28));
  const tier2Geo = useDisposable(() => createPlinthGeometry(2.34, 0.24, 24));
  const tier3Geo = useDisposable(() => createPlinthGeometry(1.88, 0.24, 20));

  const ring0Geo = useDisposable(() => createTrimRingGeometry(3.38, 0.024, 48));
  const ring1Geo = useDisposable(() => createTrimRingGeometry(2.84, 0.024, 40));
  const ring2Geo = useDisposable(() => createTrimRingGeometry(2.32, 0.024, 36));

  // 8 radial raked foundation buttress spurs anchoring into the platform
  const spurs = useMemo(() => {
    const items: { pos: [number, number, number]; rot: number; scale: [number, number, number] }[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + 0.18;
      const r = 2.54;
      items.push({
        pos: [Math.cos(a) * r, 0.14, Math.sin(a) * r],
        rot: -a,
        scale: [0.30, 0.26, 0.74],
      });
    }
    return items;
  }, []);

  // Perimeter bronze lanterns with glowing amber slits
  const lanterns = useMemo(() => {
    const items: { pos: [number, number, number]; rot: number }[] = [];
    const count = 8;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + 0.22;
      const r = 2.85;
      items.push({
        pos: [Math.cos(a) * r, 0.28, Math.sin(a) * r],
        rot: -a,
      });
    }
    return items;
  }, []);

  return (
    <group name="TowerFoundation">
      {/* Tier 0 Plinth (Stone Platform Rim) */}
      <mesh geometry={tier0Geo} material={primaryMat} position={[0, 0, 0]} receiveShadow />
      <mesh geometry={ring0Geo} material={trimMat} position={[0, 0.16, 0]} />

      {/* Tier 1 Plinth (Bronze Stepped Ring) */}
      <mesh geometry={tier1Geo} material={secondaryMat} position={[0, 0.16, 0]} receiveShadow />
      <mesh geometry={ring1Geo} material={trimMat} position={[0, 0.38, 0]} />

      {/* Tier 2 Plinth (Dark Bronze Transition Terrace) */}
      <mesh geometry={tier2Geo} material={primaryMat} position={[0, 0.38, 0]} receiveShadow />
      <mesh geometry={ring2Geo} material={trimMat} position={[0, 0.62, 0]} />

      {/* Tier 3 Tower Pedestal */}
      <mesh geometry={tier3Geo} material={secondaryMat} position={[0, 0.62, 0]} receiveShadow />

      {/* Radial Foundation Buttress Spurs */}
      {spurs.map((s, idx) => (
        <group key={idx} position={s.pos} rotation-y={s.rot}>
          <mesh material={primaryMat} scale={s.scale}>
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
          {/* Sloped Bronze Weathering Cap */}
          <mesh
            material={trimMat}
            position={[0, s.scale[1] / 2 + 0.016, 0]}
            scale={[s.scale[0] * 1.06, 0.032, s.scale[2] * 1.06]}
          >
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
          <mesh
            material={edgeMat}
            position={[0, s.scale[1] / 2 + 0.034, 0]}
            scale={[s.scale[0] * 1.08, 0.01, s.scale[2] * 1.08]}
          >
            <boxGeometry args={[1, 1, 1]} />
          </mesh>
        </group>
      ))}

      {/* Perimeter Bronze Lantern Bollards */}
      {lanterns.map((l, idx) => (
        <group key={idx} position={l.pos} rotation-y={l.rot}>
          <mesh material={secondaryMat} position={[0, 0.08, 0]}>
            <boxGeometry args={[0.08, 0.16, 0.08]} />
          </mesh>
          <mesh material={trimMat} position={[0, 0.17, 0]}>
            <boxGeometry args={[0.11, 0.03, 0.11]} />
          </mesh>
          <mesh material={lightMat} position={[0, 0.1, 0.042]}>
            <planeGeometry args={[0.045, 0.08]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponent: SecondaryPinnacle                                    */
/* ------------------------------------------------------------------ */

interface PinnacleProps {
  position: [number, number, number];
  baseHeight: number;
  width: number;
  depth: number;
  capHeight: number;
  lightStart?: number;
  lightLength?: number;
  rotationY?: number;
  setbackHeight?: number;
  primaryMat: THREE.Material;
  secondaryMat: THREE.Material;
  trimMat: THREE.Material;
  edgeMat: THREE.Material;
  lightMat: THREE.Material;
}

export function SecondaryPinnacle({
  position,
  baseHeight,
  width,
  depth,
  capHeight,
  lightStart,
  lightLength,
  rotationY = 0,
  setbackHeight,
  primaryMat,
  secondaryMat,
  trimMat,
  edgeMat,
  lightMat,
}: PinnacleProps) {
  const capGeo = useDisposable(() => createPyramidGeometry(width, capHeight), [width, capHeight]);

  const hasSetback = setbackHeight !== undefined && setbackHeight < baseHeight;
  const h1 = hasSetback ? setbackHeight : baseHeight;
  const h2 = hasSetback ? baseHeight - setbackHeight : 0;
  const w2 = width * 0.76;
  const d2 = depth * 0.76;
  const capGeoSetback = useDisposable(
    () => createPyramidGeometry(w2, capHeight),
    [w2, capHeight],
  );

  return (
    <group position={position} rotation-y={rotationY}>
      {/* Lower Shaft Pier */}
      <mesh material={primaryMat} position={[0, h1 / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[width, h1, depth]} />
      </mesh>

      {/* Corner pilaster chamfers for architectural depth */}
      {[-width / 2 + 0.03, width / 2 - 0.03].map((cx) =>
        [-depth / 2 + 0.03, depth / 2 - 0.03].map((cz) => (
          <mesh key={`${cx}-${cz}`} material={secondaryMat} position={[cx, h1 / 2, cz]}>
            <boxGeometry args={[0.07, h1, 0.07]} />
          </mesh>
        )),
      )}

      {hasSetback ? (
        <>
          {/* Sloped Weathering Setback Transition */}
          <ShadowGapCornice
            position={[0, h1, 0]}
            size={[width, 0.05, depth]}
            projection={0.06}
            primaryMat={primaryMat}
            trimMat={trimMat}
            edgeMat={edgeMat}
          />
          {/* Upper Slender Shaft */}
          <mesh material={secondaryMat} position={[0, h1 + h2 / 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[w2, h2, d2]} />
          </mesh>
          <ShadowGapCornice
            position={[0, baseHeight, 0]}
            size={[w2, 0.045, d2]}
            projection={0.05}
            primaryMat={primaryMat}
            trimMat={trimMat}
            edgeMat={edgeMat}
          />
          {/* Pointed Needle Cap */}
          <mesh geometry={capGeoSetback} material={trimMat} position={[0, baseHeight, 0]} castShadow />
          <mesh material={edgeMat} position={[0, baseHeight + capHeight * 0.5, 0]}>
            <boxGeometry args={[0.02, capHeight, 0.02]} />
          </mesh>
        </>
      ) : (
        <>
          <ShadowGapCornice
            position={[0, baseHeight, 0]}
            size={[width, 0.045, depth]}
            projection={0.05}
            primaryMat={primaryMat}
            trimMat={trimMat}
            edgeMat={edgeMat}
          />
          {/* Pointed Needle Cap */}
          <mesh geometry={capGeo} material={trimMat} position={[0, baseHeight, 0]} castShadow />
          <mesh material={edgeMat} position={[0, baseHeight + capHeight * 0.5, 0]}>
            <boxGeometry args={[0.02, capHeight, 0.02]} />
          </mesh>
        </>
      )}

      {/* Very Thin Recessed Amber Light Channel in Niche */}
      {lightStart !== undefined && lightLength !== undefined && lightLength > 0 && (
        <group position={[0, lightStart + lightLength / 2, depth / 2 + 0.012]}>
          <mesh material={primaryMat}>
            <boxGeometry args={[width * 0.28 + 0.02, lightLength + 0.04, 0.03]} />
          </mesh>
          <mesh material={lightMat} position={[0, 0, 0.01]}>
            <boxGeometry args={[width * 0.18, lightLength, 0.022]} />
          </mesh>
        </group>
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponent: OrbitalCrown                                         */
/* ------------------------------------------------------------------ */

interface OrbitalCrownProps {
  position: [number, number, number];
  accentMat: THREE.Material;
  trimMat: THREE.Material;
  coreMat: THREE.Material;
  glowTex: THREE.Texture;
  motionSpeed: number;
}

export function OrbitalCrown({ position, accentMat, trimMat, coreMat, glowTex, motionSpeed }: OrbitalCrownProps) {
  const rootRef = useRef<THREE.Group>(null);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);
  const ring4Ref = useRef<THREE.Group>(null);

  // 4 thin, mechanically precise elliptical armillary rings
  const ringGeo1 = useDisposable(() => new THREE.TorusGeometry(1.20, 0.014, 6, 64));
  const ringGeo2 = useDisposable(() => new THREE.TorusGeometry(1.06, 0.013, 6, 64));
  const ringGeo3 = useDisposable(() => new THREE.TorusGeometry(0.92, 0.012, 6, 64));
  const ringGeo4 = useDisposable(() => new THREE.TorusGeometry(1.14, 0.013, 6, 64));

  const strutGeo = useDisposable(createStrutGeometry);
  const beadGeo = useDisposable(() => new THREE.SphereGeometry(0.034, 12, 12));

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05) * motionSpeed;
    if (rootRef.current) rootRef.current.rotation.y += dt * 0.14;
    if (ring1Ref.current) ring1Ref.current.rotation.z += dt * 0.24;
    if (ring2Ref.current) ring2Ref.current.rotation.x -= dt * 0.20;
    if (ring3Ref.current) ring3Ref.current.rotation.y += dt * 0.28;
    if (ring4Ref.current) ring4Ref.current.rotation.z -= dt * 0.16;
  });

  return (
    <group ref={rootRef} position={position} name="OrbitalCrown">
      {/* 4 Gothic Curved Struts cradling the armillary sphere from below */}
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2;
        return (
          <group key={i} rotation-y={a} position={[0, -0.28, 0]}>
            <mesh
              geometry={strutGeo}
              material={trimMat}
              position={[0.22, 0.14, 0]}
              rotation={[0, 0, -0.26]}
              scale={[1, 0.82, 1]}
            />
          </group>
        );
      })}

      {/* Central Luminous Core Sphere (Warm Celestial Light) */}
      <mesh material={coreMat}>
        <sphereGeometry args={[0.36, 28, 20]} />
      </mesh>

      {/* Delicate Inner Astrolabe Gold Ring */}
      <mesh material={trimMat} scale={[1.05, 1.05, 1.05]}>
        <torusGeometry args={[0.38, 0.010, 4, 32]} />
      </mesh>

      {/* Soft Corona Glow Sprite (Restrained radiance without washed-out bloom) */}
      <sprite scale={[2.4, 2.4, 1]}>
        <spriteMaterial
          map={glowTex}
          color="#ffb84d"
          transparent
          opacity={0.20}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </sprite>

      {/* Ring 1 — Steep inclined armillary ellipse with precision pivot beads */}
      <group ref={ring1Ref} rotation={[0.95, 0.2, 0.4]}>
        <mesh geometry={ringGeo1} material={accentMat} />
        <mesh geometry={beadGeo} material={trimMat} position={[1.20, 0, 0]} />
        <mesh geometry={beadGeo} material={trimMat} position={[-1.20, 0, 0]} />
      </group>

      {/* Ring 2 — Counter-tilted armillary ellipse */}
      <group ref={ring2Ref} rotation={[-0.65, 0.75, -0.35]}>
        <mesh geometry={ringGeo2} material={accentMat} />
        <mesh geometry={beadGeo} material={trimMat} position={[0, 1.06, 0]} />
        <mesh geometry={beadGeo} material={trimMat} position={[0, -1.06, 0]} />
      </group>

      {/* Ring 3 — Precession ring */}
      <group ref={ring3Ref} rotation={[0.35, -0.85, 0.8]}>
        <mesh geometry={ringGeo3} material={accentMat} />
        <mesh geometry={beadGeo} material={trimMat} position={[0.92, 0, 0]} />
      </group>

      {/* Ring 4 — Near-polar gimbal loop */}
      <group ref={ring4Ref} rotation={[1.4, 0.3, -0.5]}>
        <mesh geometry={ringGeo4} material={accentMat} />
        <mesh geometry={beadGeo} material={trimMat} position={[0, 1.14, 0]} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponent: CentralSpire                                         */
/* ------------------------------------------------------------------ */

interface CentralSpireProps {
  primaryMat: THREE.Material;
  secondaryMat: THREE.Material;
  trimMat: THREE.Material;
  edgeMat: THREE.Material;
  lightMat: THREE.Material;
  coreMat: THREE.Material;
}

export function CentralSpire({ primaryMat, secondaryMat, trimMat, edgeMat, lightMat, coreMat }: CentralSpireProps) {
  // Reusable geometric elements
  const midGableGeo = useDisposable(() => createGothicGableGeometry(0.36, 0.20, 0.04));
  const upperGableGeo = useDisposable(() => createGothicGableGeometry(0.28, 0.16, 0.035));
  const roofStage2Geo = useDisposable(() => createSlopedRoofGeometry(2.18, 1.54, 0.44));
  const roofStage3Geo = useDisposable(() => createSlopedRoofGeometry(1.66, 1.06, 0.42));
  const roofStage4Geo = useDisposable(() => createSlopedRoofGeometry(1.14, 0.72, 0.34));
  const highSpireGeo = useDisposable(() => createOctagonalSpireGeometry(0.68, 2.0));
  const needleDormerGeo = useDisposable(() => createPyramidGeometry(0.16, 0.38, 4));

  return (
    <group name="CentralSpire">
      {/* ============================================================= */}
      {/* STAGE 1: Cathedral Base Sanctuary (Y: 0.86 -> 3.86, H = 3.00)  */}
      {/* ============================================================= */}
      <group position={[0, 0, 0]}>
        {/* Main Base Sanctuary Body (Faceted Octagonal/Chamfered Core) */}
        <mesh material={primaryMat} position={[0, 0.86 + 3.00 / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.04, 3.00, 2.04]} />
        </mesh>

        {/* 4 Corner Stepped Buttress Piers with Continuous Sloped Weatherings */}
        {[-0.92, 0.92].map((x) =>
          [-0.92, 0.92].map((z) => (
            <group key={`s1-b-${x}-${z}`} position={[x, 0.86, z]}>
              {/* Lower Buttress Block */}
              <mesh material={secondaryMat} position={[0, 1.64 / 2, 0]} castShadow receiveShadow>
                <boxGeometry args={[0.50, 1.64, 0.50]} />
              </mesh>
              {/* Sloped Bronze Weathering Cap at Y = 2.50 */}
              <mesh material={trimMat} position={[0, 1.66, 0]}>
                <boxGeometry args={[0.52, 0.035, 0.52]} />
              </mesh>
              {/* Upper Stepped Buttress Pier */}
              <mesh material={secondaryMat} position={[0, 1.68 + 1.32 / 2, 0]} castShadow>
                <boxGeometry args={[0.38, 1.32, 0.38]} />
              </mesh>
              {/* Buttress Top Cornice Trim */}
              <mesh material={trimMat} position={[0, 3.00, 0]}>
                <boxGeometry args={[0.42, 0.035, 0.42]} />
              </mesh>
              {/* Corner Spirelet Finial at Buttress Top */}
              <mesh material={edgeMat} position={[0, 3.10, 0]}>
                <boxGeometry args={[0.12, 0.16, 0.12]} />
              </mesh>
            </group>
          )),
        )}

        {/* Diagonal Raked Buttress Footings anchoring into the platform */}
        {[-1.28, 1.28].map((x) =>
          [-1.28, 1.28].map((z) => (
            <group key={`s1-foot-${x}-${z}`} position={[x * 0.85, 0.86 + 0.36, z * 0.85]}>
              <mesh material={primaryMat} rotation={[x > 0 ? 0.32 : -0.32, 0, z > 0 ? -0.32 : 0.32]}>
                <boxGeometry args={[0.26, 0.72, 0.26]} />
              </mesh>
              <mesh material={trimMat} position={[0, 0.38, 0]}>
                <boxGeometry args={[0.28, 0.026, 0.28]} />
              </mesh>
            </group>
          )),
        )}

        {/* Front Facade (+Z): Grand Cathedral Portal with Nested Arches */}
        <GrandCathedralPortal
          position={[0, 2.24, 1.03]}
          width={1.12}
          height={2.26}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
        />

        {/* Back and Side Facades: Deep Recessed Lancet Arch Windows (No bright glare) */}
        <GothicLancetNiche
          position={[0, 2.24, -1.03]}
          width={0.42}
          height={1.92}
          archGeo={midGableGeo}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
          hasLight={false}
        />
        <GothicLancetNiche
          position={[1.03, 2.24, 0]}
          width={0.42}
          height={1.92}
          rotationY={Math.PI / 2}
          archGeo={midGableGeo}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
          hasLight={false}
        />
        <GothicLancetNiche
          position={[-1.03, 2.24, 0]}
          width={0.42}
          height={1.92}
          rotationY={Math.PI / 2}
          archGeo={midGableGeo}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
          hasLight={false}
        />

        {/* Stage 1 Cornice with Deep Shadow Gap */}
        <ShadowGapCornice
          position={[0, 3.86, 0]}
          size={[2.28, 0.12, 2.28]}
          projection={0.10}
          primaryMat={primaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
        />

        {/* Parapet Crenellations at Tier 1 Corners */}
        {[-1.12, 1.12].map((x) =>
          [-1.12, 1.12].map((z) => (
            <group key={`s1-cren-${x}-${z}`} position={[x, 3.98, z]}>
              <mesh material={trimMat}>
                <boxGeometry args={[0.16, 0.14, 0.16]} />
              </mesh>
              <mesh material={edgeMat} position={[0, 0.075, 0]}>
                <boxGeometry args={[0.18, 0.015, 0.18]} />
              </mesh>
            </group>
          )),
        )}
      </group>

      {/* ============================================================= */}
      {/* STAGE 2: Mid-Tier Sanctuary Shaft (Y: 3.86 -> 7.16, H = 3.30)  */}
      {/* ============================================================= */}
      <group position={[0, 0, 0]}>
        {/* Steep Sloped Bronze Weathering Roof bridging the setback */}
        <mesh geometry={roofStage2Geo} material={secondaryMat} position={[0, 3.86, 0]} castShadow />
        <mesh material={trimMat} position={[0, 4.30, 0]}>
          <boxGeometry args={[1.58, 0.035, 1.58]} />
        </mesh>

        {/* Mid-Tier Sanctuary Shaft Body */}
        <mesh material={primaryMat} position={[0, 4.30 + 2.86 / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.52, 2.86, 1.52]} />
        </mesh>

        {/* Corner Pilaster Buttresses with Mid-Height Sloped Drip Weathering */}
        {[-0.68, 0.68].map((x) =>
          [-0.68, 0.68].map((z) => (
            <group key={`s2-p-${x}-${z}`} position={[x, 4.30, z]}>
              <mesh material={secondaryMat} position={[0, 1.62 / 2, 0]} castShadow>
                <boxGeometry args={[0.32, 1.62, 0.32]} />
              </mesh>
              {/* Sloped Weathering Drip Cap at Y = 5.92 */}
              <mesh material={trimMat} position={[0, 1.63, 0]}>
                <boxGeometry args={[0.34, 0.026, 0.34]} />
              </mesh>
              <mesh material={secondaryMat} position={[0, 1.65 + 1.21 / 2, 0]} castShadow>
                <boxGeometry args={[0.26, 1.21, 0.26]} />
              </mesh>
            </group>
          )),
        )}

        {/* Front Facade: Deep Recessed Lancet Window with Narrow Slit */}
        <GothicLancetNiche
          position={[0, 5.68, 0.77]}
          width={0.36}
          height={2.08}
          archGeo={midGableGeo}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
          hasLight={true}
        />
        {/* Back and Side Facades */}
        <GothicLancetNiche
          position={[0, 5.68, -0.77]}
          width={0.36}
          height={2.08}
          archGeo={midGableGeo}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
          hasLight={false}
        />
        <GothicLancetNiche
          position={[0.77, 5.68, 0]}
          width={0.36}
          height={2.08}
          rotationY={Math.PI / 2}
          archGeo={midGableGeo}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
          hasLight={false}
        />
        <GothicLancetNiche
          position={[-0.77, 5.68, 0]}
          width={0.36}
          height={2.08}
          rotationY={Math.PI / 2}
          archGeo={midGableGeo}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
          hasLight={false}
        />

        {/* Stage 2 Cornice with Deep Shadow Gap */}
        <ShadowGapCornice
          position={[0, 7.16, 0]}
          size={[1.76, 0.11, 1.76]}
          projection={0.08}
          primaryMat={primaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
        />

        {/* Pointed Crest Pediments over each cornice face */}
        {[
          { pos: [0, 7.25, 0.89], rot: 0 },
          { pos: [0, 7.25, -0.89], rot: Math.PI },
          { pos: [0.89, 7.25, 0], rot: Math.PI / 2 },
          { pos: [-0.89, 7.25, 0], rot: -Math.PI / 2 },
        ].map((c, idx) => (
          <group key={`s2-crest-${idx}`} position={c.pos as [number, number, number]} rotation-y={c.rot}>
            <mesh geometry={midGableGeo} material={trimMat} scale={[0.34, 0.14, 0.04]} />
          </group>
        ))}
      </group>

      {/* ============================================================= */}
      {/* STAGE 3: Upper Gothic Shaft (Y: 7.16 -> 10.56, H = 3.40)       */}
      {/* ============================================================= */}
      <group position={[0, 0, 0]}>
        {/* Steep Sloped Bronze Weathering Roof from 1.52 to 1.04 */}
        <mesh geometry={roofStage3Geo} material={secondaryMat} position={[0, 7.16, 0]} castShadow />
        <mesh material={trimMat} position={[0, 7.58, 0]}>
          <boxGeometry args={[1.08, 0.03, 1.08]} />
        </mesh>

        {/* Slender Gothic Upper Shaft Body */}
        <mesh material={primaryMat} position={[0, 7.58 + 2.98 / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.04, 2.98, 1.04]} />
        </mesh>

        {/* Corner Slender Gothic Pilaster Ribs running full height */}
        {[-0.48, 0.48].map((x) =>
          [-0.48, 0.48].map((z) => (
            <mesh key={`s3-r-${x}-${z}`} material={secondaryMat} position={[x, 7.58 + 2.98 / 2, z]} castShadow>
              <boxGeometry args={[0.18, 2.98, 0.18]} />
            </mesh>
          )),
        )}

        {/* Front Facade: Ultra-Narrow Slender Stained-Glass Lancet */}
        <GothicLancetNiche
          position={[0, 8.98, 0.53]}
          width={0.28}
          height={2.26}
          archGeo={upperGableGeo}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
          hasLight={true}
        />
        {/* Back and Sides (Masonry Blind Lancets) */}
        <GothicLancetNiche
          position={[0, 8.98, -0.53]}
          width={0.28}
          height={2.26}
          archGeo={upperGableGeo}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
          hasLight={false}
        />
        <GothicLancetNiche
          position={[0.53, 8.98, 0]}
          width={0.28}
          height={2.26}
          rotationY={Math.PI / 2}
          archGeo={upperGableGeo}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
          hasLight={false}
        />
        <GothicLancetNiche
          position={[-0.53, 8.98, 0]}
          width={0.28}
          height={2.26}
          rotationY={Math.PI / 2}
          archGeo={upperGableGeo}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
          hasLight={false}
        />

        {/* Stage 3 Cornice with Deep Shadow Gap */}
        <ShadowGapCornice
          position={[0, 10.56, 0]}
          size={[1.24, 0.10, 1.24]}
          projection={0.07}
          primaryMat={primaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
        />

        {/* Corner Micro-Crockets / Spirelet Bases */}
        {[-0.58, 0.58].map((x) =>
          [-0.58, 0.58].map((z) => (
            <mesh key={`s3-cr-${x}-${z}`} material={edgeMat} position={[x, 10.64, z]}>
              <boxGeometry args={[0.08, 0.10, 0.08]} />
            </mesh>
          )),
        )}
      </group>

      {/* ============================================================= */}
      {/* STAGE 4: Celestial Open Lantern & High Spire (Y: 10.56 -> 13.78) */}
      {/* ============================================================= */}
      <group position={[0, 0, 0]}>
        {/* Sloped Bronze Weathering Roof from 1.04 down to 0.70 */}
        <mesh geometry={roofStage4Geo} material={secondaryMat} position={[0, 10.56, 0]} castShadow />
        <mesh material={trimMat} position={[0, 10.90, 0]}>
          <boxGeometry args={[0.74, 0.026, 0.74]} />
        </mesh>

        {/* Open Belvedere / Belfry with 8 Slender Colonnade Posts */}
        {[-0.30, 0.30].map((x) =>
          [-0.30, 0.30].map((z) => (
            <mesh key={`s4-col-${x}-${z}`} material={secondaryMat} position={[x, 10.90 + 0.88 / 2, z]}>
              <cylinderGeometry args={[0.038, 0.044, 0.88, 8]} />
            </mesh>
          )),
        )}
        {/* Mid-facet colonnade posts */}
        {[
          [0, 10.90 + 0.88 / 2, 0.32],
          [0, 10.90 + 0.88 / 2, -0.32],
          [0.32, 10.90 + 0.88 / 2, 0],
          [-0.32, 10.90 + 0.88 / 2, 0],
        ].map((pos, idx) => (
          <mesh key={`s4-midcol-${idx}`} material={secondaryMat} position={pos as [number, number, number]}>
            <cylinderGeometry args={[0.032, 0.038, 0.88, 8]} />
          </mesh>
        ))}

        {/* Interior Luminous Core radiating celestial light through the open colonnade */}
        <mesh material={coreMat} position={[0, 11.34, 0]}>
          <sphereGeometry args={[0.18, 16, 12]} />
        </mesh>

        {/* Spire Base Cornice Shelf */}
        <ShadowGapCornice
          position={[0, 11.78, 0]}
          size={[0.80, 0.065, 0.80]}
          projection={0.06}
          primaryMat={primaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
        />

        {/* High Gothic Needle Spire (Tapered 8-Sided Spire) */}
        <mesh geometry={highSpireGeo} material={trimMat} position={[0, 11.84, 0]} castShadow />

        {/* Pale Gold Ridge Highlight Ribs along Spire Hips */}
        <mesh material={edgeMat} position={[0, 11.84 + 2.0 / 2, 0]} rotation-y={Math.PI / 4}>
          <boxGeometry args={[0.018, 2.0, 0.018]} />
        </mesh>
        <mesh material={edgeMat} position={[0, 11.84 + 2.0 / 2, 0]} rotation-y={-Math.PI / 4}>
          <boxGeometry args={[0.018, 2.0, 0.018]} />
        </mesh>

        {/* 4 Pointed Spirelet Lucarnes / Dormers at base of spire */}
        {[
          { pos: [0, 11.84, 0.35], rot: 0 },
          { pos: [0, 11.84, -0.35], rot: Math.PI },
          { pos: [0.35, 11.84, 0], rot: Math.PI / 2 },
          { pos: [-0.35, 11.84, 0], rot: -Math.PI / 2 },
        ].map((d, idx) => (
          <group key={`luc-${idx}`} position={d.pos as [number, number, number]} rotation-y={d.rot}>
            <mesh geometry={needleDormerGeo} material={trimMat} scale={[1, 0.75, 0.55]} />
          </group>
        ))}

        {/* Spire Finial Neck & Crown Support Collar */}
        <mesh material={edgeMat} position={[0, 13.68, 0]}>
          <cylinderGeometry args={[0.05, 0.10, 0.16, 12]} />
        </mesh>
        <mesh material={trimMat} position={[0, 13.78, 0]}>
          <cylinderGeometry args={[0.24, 0.15, 0.08, 16]} />
        </mesh>
        <mesh material={edgeMat} position={[0, 13.84, 0]}>
          <torusGeometry args={[0.25, 0.014, 4, 32]} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Subcomponent: TowerIslandDetails                                   */
/* ------------------------------------------------------------------ */

interface IslandDetailsProps {
  primaryMat: THREE.Material;
  trimMat: THREE.Material;
}

export function TowerIslandDetails({ primaryMat, trimMat }: IslandDetailsProps) {
  const brackets = useMemo(() => {
    const list: { pos: [number, number, number]; rot: number }[] = [];
    const count = 4;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.PI / 4;
      const r = 3.6;
      list.push({
        pos: [Math.cos(a) * r, 0.09, Math.sin(a) * r],
        rot: -a,
      });
    }
    return list;
  }, []);

  return (
    <group name="TowerIslandDetails">
      {brackets.map((b, idx) => (
        <group key={idx} position={b.pos} rotation-y={b.rot}>
          <mesh material={primaryMat} position={[0, 0, 0]}>
            <boxGeometry args={[0.18, 0.18, 0.26]} />
          </mesh>
          <mesh material={trimMat} position={[0, 0.1, 0]}>
            <boxGeometry args={[0.22, 0.025, 0.3]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Main Landmark Assembly: KnowledgeTower                             */
/* ------------------------------------------------------------------ */

export function KnowledgeTower() {
  const kit = useKit();

  const primaryMat = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.primaryStructure,
        roughness: 0.65,
        metalness: 0.58,
        bumpMap: kit.noiseTex,
        bumpScale: 0.018,
      }),
    [kit.noiseTex],
  );

  const secondaryMat = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.secondaryStructure,
        roughness: 0.58,
        metalness: 0.54,
        bumpMap: kit.noiseTex,
        bumpScale: 0.018,
      }),
    [kit.noiseTex],
  );

  const trimMat = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.architecturalTrim,
        roughness: 0.32,
        metalness: 0.88,
        emissive: '#35200a',
        emissiveIntensity: 0.35,
      }),
    [],
  );

  const edgeMat = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: PALETTE.edgeHighlight,
        roughness: 0.22,
        metalness: 0.94,
        emissive: '#54320e',
        emissiveIntensity: 0.40,
      }),
    [],
  );

  const lightMat = useDisposable(
    () =>
      new THREE.MeshBasicMaterial({
        color: PALETTE.lightChannel,
        toneMapped: false,
      }),
    [],
  );

  const coreMat = useDisposable(
    () =>
      new THREE.MeshBasicMaterial({
        color: PALETTE.lightCore,
        toneMapped: false,
      }),
    [],
  );

  const ringAccentMat = useDisposable(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#342618',
        roughness: 0.30,
        metalness: 0.88,
        emissive: '#ffb84d',
        emissiveIntensity: 0.58,
      }),
    [],
  );

  // Clustered Asymmetrical Gothic Pinnacles with deliberately varied heights and setbacks
  const pinnacles = useMemo(() => [
    // --- TIER 1: Lower Foundation Buttress Towers (Heights 2.1 - 2.9) ---
    {
      pos: [-1.34, 0.86, 0.74] as [number, number, number],
      baseH: 2.3,
      w: 0.52,
      d: 0.52,
      capH: 0.68,
      rotY: 0.05,
    },
    {
      pos: [1.28, 0.86, 0.68] as [number, number, number],
      baseH: 2.1,
      w: 0.48,
      d: 0.48,
      capH: 0.60,
      rotY: -0.08,
    },
    {
      pos: [-1.58, 0.86, -0.15] as [number, number, number],
      baseH: 2.6,
      w: 0.54,
      d: 0.54,
      capH: 0.72,
      rotY: Math.PI / 2,
    },
    {
      pos: [1.52, 0.86, -0.2] as [number, number, number],
      baseH: 2.3,
      w: 0.50,
      d: 0.50,
      capH: 0.64,
      rotY: -Math.PI / 2,
    },
    {
      pos: [-1.12, 0.86, -1.14] as [number, number, number],
      baseH: 2.8,
      w: 0.54,
      d: 0.54,
      capH: 0.74,
      rotY: Math.PI,
    },
    {
      pos: [1.14, 0.86, -1.08] as [number, number, number],
      baseH: 2.5,
      w: 0.50,
      d: 0.50,
      capH: 0.68,
      rotY: Math.PI,
    },

    // --- TIER 2: Mid Flanking Spires (Heights 4.0 - 5.8) ---
    // Prominent Left Mid-Spire with setback and flying arch (iconic silhouette feature)
    {
      pos: [-1.02, 0.86, 0.34] as [number, number, number],
      baseH: 5.8,
      w: 0.50,
      d: 0.50,
      capH: 0.90,
      setbackH: 4.0,
      lightStart: 1.0,
      lightLen: 3.6,
      rotY: 0.08,
      braceTarget: [-0.74, 5.8, 0.28] as [number, number, number],
    },
    // Front-Right Mid-Spire with flying arch
    {
      pos: [0.94, 0.86, 0.50] as [number, number, number],
      baseH: 4.8,
      w: 0.46,
      d: 0.46,
      capH: 0.80,
      rotY: -0.05,
      braceTarget: [0.74, 5.2, 0.42] as [number, number, number],
    },
    // Rear-Right Mid-Pylon
    {
      pos: [0.84, 0.86, -0.78] as [number, number, number],
      baseH: 6.0,
      w: 0.44,
      d: 0.44,
      capH: 0.85,
      setbackH: 4.3,
      rotY: Math.PI * 0.9,
    },
    // Rear-Left Mid-Pylon
    {
      pos: [-0.82, 0.86, -0.82] as [number, number, number],
      baseH: 5.2,
      w: 0.42,
      d: 0.42,
      capH: 0.78,
      rotY: Math.PI * 1.05,
    },
    // Right Flank Mid-Spire
    {
      pos: [1.22, 0.86, -0.12] as [number, number, number],
      baseH: 4.0,
      w: 0.40,
      d: 0.40,
      capH: 0.72,
      rotY: -Math.PI / 2,
    },
    // Left Flank Mid-Spire
    {
      pos: [-1.22, 0.86, -0.18] as [number, number, number],
      baseH: 4.6,
      w: 0.40,
      d: 0.40,
      capH: 0.76,
      rotY: Math.PI / 2,
    },

    // --- TIER 3: High Slender Pinnacles (Y_top 8.2 - 10.4) ---
    // Upper Left Needle hugging Tier 3
    {
      pos: [-0.56, 4.4, 0.22] as [number, number, number],
      baseH: 4.4,
      w: 0.28,
      d: 0.28,
      capH: 0.95,
      lightStart: 0.8,
      lightLen: 2.8,
      rotY: 0.06,
    },
    // Upper Right Needle
    {
      pos: [0.54, 4.6, 0.18] as [number, number, number],
      baseH: 3.8,
      w: 0.26,
      d: 0.26,
      capH: 0.88,
      rotY: -0.06,
    },
    // Upper Rear Pylon
    {
      pos: [0.04, 5.0, -0.62] as [number, number, number],
      baseH: 4.6,
      w: 0.30,
      d: 0.30,
      capH: 0.92,
      rotY: Math.PI,
    },
    // Upper Front-Left Step Needle
    {
      pos: [-0.36, 5.0, -0.36] as [number, number, number],
      baseH: 3.4,
      w: 0.24,
      d: 0.24,
      capH: 0.80,
      rotY: Math.PI * 0.75,
    },
  ], []);

  return (
    <group name="KnowledgeTower">
      {/* 1. Stepped Layered Architectural Foundation Platform */}
      <TowerFoundation
        primaryMat={primaryMat}
        secondaryMat={secondaryMat}
        trimMat={trimMat}
        edgeMat={edgeMat}
        lightMat={lightMat}
      />

      {/* 2. Primary Central Spire Structure */}
      <CentralSpire
        primaryMat={primaryMat}
        secondaryMat={secondaryMat}
        trimMat={trimMat}
        edgeMat={edgeMat}
        lightMat={lightMat}
        coreMat={coreMat}
      />

      {/* 3. Asymmetrical Clustered Secondary Pinnacles */}
      {pinnacles.map((p, idx) => (
        <SecondaryPinnacle
          key={idx}
          position={p.pos}
          baseHeight={p.baseH}
          width={p.w}
          depth={p.d}
          capHeight={p.capH}
          setbackHeight={p.setbackH}
          lightStart={p.lightStart}
          lightLength={p.lightLen}
          rotationY={p.rotY}
          primaryMat={primaryMat}
          secondaryMat={secondaryMat}
          trimMat={trimMat}
          edgeMat={edgeMat}
          lightMat={lightMat}
        />
      ))}

      {/* Flying Buttress Arches connecting mid-spires to central tower */}
      {pinnacles
        .filter((p) => p.braceTarget)
        .map((p, idx) => (
          <FlyingArch
            key={`brace-${idx}`}
            start={[p.pos[0], p.pos[1] + (p.setbackH ?? p.baseH) * 0.82, p.pos[2]]}
            end={p.braceTarget!}
            trimMat={trimMat}
            edgeMat={edgeMat}
            secondaryMat={secondaryMat}
          />
        ))}

      {/* 4. Local Island Foundation Details */}
      <TowerIslandDetails
        primaryMat={primaryMat}
        trimMat={trimMat}
      />

      {/* 5. Luminous Astronomical Orbital Energy Crown (Y = 14.12) */}
      <OrbitalCrown
        position={[0, 14.12, 0]}
        accentMat={ringAccentMat}
        trimMat={trimMat}
        coreMat={coreMat}
        glowTex={kit.glowTex}
        motionSpeed={kit.q.motion}
      />
    </group>
  );
}
export default KnowledgeTower;
