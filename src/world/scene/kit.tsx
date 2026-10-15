/**
 * Shared geometries, materials and canvas textures for the world.
 * Created once per canvas and disposed when the canvas unmounts.
 */
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import {
  makeCloudTexture,
  makeGlowTexture,
  makeGrassTexture,
  makeMistTexture,
  makeNoiseTexture,
  makeStreakTexture,
  makeWaterTexture,
} from '../../components/three/procedural';

export type V3 = [number, number, number];
export interface Inst {
  p: V3;
  s: V3;
  r?: number;
}

export interface Quality {
  tier: 'high' | 'low';
  /** 0 when the visitor prefers reduced motion. */
  motion: number;
  clouds: number;
  embers: number;
  distant: number;
  city: number;
}

export interface Kit {
  box: THREE.BoxGeometry;
  cone: THREE.ConeGeometry;
  plane: THREE.PlaneGeometry;
  cyl: THREE.CylinderGeometry;
  rock: THREE.MeshStandardMaterial;
  grass: THREE.MeshStandardMaterial;
  slab: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  bronze: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
  foliage: THREE.MeshStandardMaterial;
  foliageAmber: THREE.MeshStandardMaterial;
  light: THREE.MeshBasicMaterial;
  glow: THREE.MeshBasicMaterial;
  /** Fog-responsive glow for distant islands and halos */
  glowFog: THREE.MeshBasicMaterial;
  gold: THREE.MeshStandardMaterial;
  /** Dark brushed metal for the stage and stairs (picks up the warm environment map). */
  metal: THREE.MeshStandardMaterial;
  /** Dim engraved-gold lines (not bright enough to bloom). */
  dimGold: THREE.MeshBasicMaterial;
  /** Invisible material for generous pointer hit areas. */
  hit: THREE.MeshBasicMaterial;
  fall: THREE.MeshBasicMaterial;
  water: THREE.MeshStandardMaterial;
  glowTex: THREE.Texture;
  streakTex: THREE.Texture;
  cloudTex: THREE.Texture;
  noiseTex: THREE.Texture;
  grassTex: THREE.Texture;
  mistTex: THREE.Texture;
  waterTex: THREE.Texture;
  q: Quality;
}

const KitContext = createContext<Kit | null>(null);

export function KitProvider({ quality, children }: { quality: Quality; children: ReactNode }) {
  const kit = useMemo<Kit>(() => {
    const glowTex = makeGlowTexture();
    const streakTex = makeStreakTexture();
    const noiseTex = makeNoiseTexture(256, 42);
    const grassTex = makeGrassTexture(256, 88);
    const waterTex = makeWaterTexture(256, 55);
    const mistTex = makeMistTexture(128);
    const cloudTex = makeCloudTexture();

    // Bump textures repeat seamlessly
    noiseTex.repeat.set(3, 3);
    grassTex.repeat.set(2, 2);

    return {
      box: new THREE.BoxGeometry(1, 1, 1),
      cone: new THREE.ConeGeometry(0.5, 1, 6),
      plane: new THREE.PlaneGeometry(1, 1),
      cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
      // Sculpted natural crag rock with organic bump detail and warm earth tone
      rock: new THREE.MeshStandardMaterial({
        color: '#42372e',
        roughness: 0.88,
        metalness: 0.08,
        bumpMap: noiseTex,
        bumpScale: 0.08,
      }),
      // Alpine cliff grass / lush verdant moss for island plateaus
      grass: new THREE.MeshStandardMaterial({
        map: grassTex,
        color: '#4d5d32',
        roughness: 0.82,
        bumpMap: noiseTex,
        bumpScale: 0.04,
      }),
      // Weathered architectural flagstone
      slab: new THREE.MeshStandardMaterial({
        color: '#38322b',
        roughness: 0.76,
        metalness: 0.12,
        bumpMap: noiseTex,
        bumpScale: 0.03,
      }),
      // Chiselled dark granite masonry
      stone: new THREE.MeshStandardMaterial({
        color: '#221e1a',
        roughness: 0.68,
        metalness: 0.22,
        bumpMap: noiseTex,
        bumpScale: 0.025,
      }),
      // Burnished ancient bronze
      bronze: new THREE.MeshStandardMaterial({
        color: '#4a3a2a',
        roughness: 0.52,
        metalness: 0.55,
      }),
      // Weathered cedar wood for trees & poles
      wood: new THREE.MeshStandardMaterial({
        color: '#2c221a',
        roughness: 0.85,
        bumpMap: noiseTex,
        bumpScale: 0.02,
      }),
      // Lush olive-green tree foliage
      foliage: new THREE.MeshStandardMaterial({
        color: '#3e4e26',
        roughness: 0.72,
        bumpMap: noiseTex,
        bumpScale: 0.04,
        side: THREE.DoubleSide,
      }),
      // Golden autumn foliage catching the setting sun
      foliageAmber: new THREE.MeshStandardMaterial({
        color: '#8b6727',
        roughness: 0.68,
        bumpMap: noiseTex,
        bumpScale: 0.03,
        side: THREE.DoubleSide,
      }),
      light: new THREE.MeshBasicMaterial({ color: '#ffdfa9', toneMapped: false }),
      glow: new THREE.MeshBasicMaterial({
        map: glowTex,
        color: '#ffb866',
        transparent: true,
        opacity: 0.6,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
      glowFog: new THREE.MeshBasicMaterial({
        map: glowTex,
        color: '#ffb866',
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: true,
        toneMapped: false,
      }),
      // Gleaming PBR gold
      gold: new THREE.MeshStandardMaterial({
        color: '#d69e4f',
        roughness: 0.28,
        metalness: 0.88,
        emissive: '#8f561e',
        emissiveIntensity: 0.25,
      }),
      metal: new THREE.MeshStandardMaterial({
        color: '#1a1714',
        roughness: 0.52,
        metalness: 0.58,
        bumpMap: noiseTex,
        bumpScale: 0.015,
      }),
      dimGold: new THREE.MeshBasicMaterial({ color: '#9d7845', toneMapped: false }),
      hit: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false }),
      fall: new THREE.MeshBasicMaterial({
        map: streakTex,
        color: '#ffe5b8',
        transparent: true,
        opacity: 0.55,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
      // Realistic water cascade material
      water: new THREE.MeshStandardMaterial({
        map: waterTex,
        color: '#a8d2e8',
        roughness: 0.2,
        metalness: 0.1,
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
      glowTex,
      streakTex,
      cloudTex,
      noiseTex,
      grassTex,
      mistTex,
      waterTex,
      q: quality,
    };
    // Quality is fixed for the lifetime of a canvas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(
    () => () => {
      Object.values(kit).forEach((v) => (v as { dispose?: () => void })?.dispose?.());
    },
    [kit],
  );
  return <KitContext.Provider value={kit}>{children}</KitContext.Provider>;
}

export function useKit() {
  const kit = useContext(KitContext);
  if (!kit) throw new Error('useKit outside KitProvider');
  return kit;
}

/** Writes static instance transforms once. */
export function InstanceSet({
  items,
  geometry,
  material,
}: {
  items: Inst[];
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      o.scale.set(...it.s);
      o.rotation.set(0, it.r ?? 0, 0);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} />;
}

/** Disposes a memoised geometry/material when it is replaced or unmounted. */
export function useDisposable<T extends { dispose: () => void }>(factory: () => T, deps: unknown[] = []): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const value = useMemo(factory, deps);
  useEffect(() => () => value.dispose(), [value]);
  return value;
}
