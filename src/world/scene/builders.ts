/** Procedural geometry builders: floating rocks, island cities, trees, vines, waterfalls, distant mountain ridges. */
import * as THREE from 'three';
import { hash3, mulberry32 } from '../../components/three/procedural';
import type { IslandCfg } from '../landmarks';
import type { Inst } from './kit';

/**
 * Natural sculpted floating island with organic rock strata, craggy overhangs,
 * weathered terracing and a smoothly terraced plateau rim.
 */
export function buildRock(r: number, depth: number, seed: number, segments = 22) {
  const heightSegments = 12;
  const geo = new THREE.CylinderGeometry(r, r * 0.08, depth, segments, heightSegments, false);
  geo.translate(0, -depth / 2, 0);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const t = -v.y / depth; // 0 at top, 1 at bottom tip

    // Primary strata noise
    const n1 = hash3(+v.x.toFixed(2), +(v.y * 1.5).toFixed(2), +v.z.toFixed(2), seed);
    // Secondary micro-crevice noise
    const n2 = hash3(+v.z.toFixed(2), +v.x.toFixed(2), +(v.y * 2).toFixed(2), seed + 7);
    // Tertiary geological horizontal shelf noise
    const shelf = Math.sin(t * Math.PI * 4.5 + n1 * 2) * 0.12;

    if (t < 0.03) {
      // Top plateau rim: subtle organic undulating border
      const k = 1 + (n1 - 0.5) * 0.06;
      v.x *= k;
      v.z *= k;
    } else if (t > 0.96) {
      // Bottom stalactite tip: natural tapered break
      v.x += (n1 - 0.5) * r * 0.28;
      v.z += (n2 - 0.5) * r * 0.22;
      v.y -= n2 * depth * 0.15;
    } else {
      // Natural rock face with layered cliff overhangs and crags
      const crag = (n1 - 0.5) * 0.45 * (0.4 + t * 0.8) + shelf;
      const k = 1 + crag;
      v.x *= k;
      v.z *= k;
      v.y += (n2 - 0.5) * depth * 0.09;
    }
    pos.setXYZ(i, v.x, v.y, v.z);
  }

  geo.computeVertexNormals();
  return geo;
}

export interface TreeData {
  trunks: Inst[];
  canopies: Inst[];
  canopiesAmber: Inst[];
}

/**
 * Procedural alpine pines, stone conifers and autumn-amber trees
 * dotting the island rim and natural plateaus.
 */
export function buildTrees(cfg: IslandCfg, clear: number, densityScale = 1, corridor = 0): TreeData {
  const rnd = mulberry32(cfg.seed * 3137);
  const trunks: Inst[] = [];
  const canopies: Inst[] = [];
  const canopiesAmber: Inst[] = [];

  const count = Math.max(3, Math.round(cfg.r * 2.2 * densityScale));

  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    // Trees grow along the scenic outer slopes and rims of the island
    const dist = clear * 0.85 + Math.sqrt(rnd()) * (cfg.r * 0.92 - clear * 0.85);
    const x = Math.cos(a) * dist;
    const z = Math.sin(a) * dist;

    // Keep entry stairs corridor clear
    if (corridor && z > 0 && Math.abs(x) < corridor + 0.6) continue;

    const scale = 0.65 + rnd() * 0.7;
    const trunkH = 1.1 * scale;
    const trunkW = 0.14 * scale;

    // Wood trunk slightly leaning with mountain winds
    trunks.push({
      p: [x, trunkH / 2, z],
      s: [trunkW, trunkH, trunkW],
      r: (rnd() - 0.5) * 0.25,
    });

    const isAmber = rnd() < 0.38;
    const foliageList = isAmber ? canopiesAmber : canopies;

    // Layered conifer/pine canopy tiers
    const tiers = 3;
    for (let t = 0; t < tiers; t++) {
      const tierY = trunkH * 0.55 + t * 0.55 * scale;
      const tierR = (0.75 - t * 0.18) * scale;
      foliageList.push({
        p: [x, tierY + 0.35 * scale, z],
        s: [tierR * 2, 0.85 * scale, tierR * 2],
        r: rnd() * Math.PI,
      });
    }
  }

  return { trunks, canopies, canopiesAmber };
}

/**
 * Hanging creeping vines and roots draping down over the crags from island edges.
 */
export function buildVines(cfg: IslandCfg): Inst[] {
  const rnd = mulberry32(cfg.seed * 9127);
  const vines: Inst[] = [];
  const count = Math.round(cfg.r * 3.5);

  for (let i = 0; i < count; i++) {
    const a = rnd() * Math.PI * 2;
    const r = cfg.r * (0.94 + rnd() * 0.05);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    const len = 0.8 + rnd() * (cfg.depth * 0.65);
    const w = 0.12 + rnd() * 0.15;

    vines.push({
      p: [x, -len / 2 - 0.05, z],
      s: [w, len, 0.04],
      r: Math.PI / 2 - a + (rnd() - 0.5) * 0.3,
    });
  }

  return vines;
}

export interface City {
  stones: Inst[];
  spires: Inst[];
  windows: Inst[];
  glows: Inst[];
}

/**
 * Architectural masonry, terrace walls and cliff dwellings with warm lanterns.
 */
export function buildCity(cfg: IslandCfg, clear: number, densityScale = 1, corridor = 0): City {
  const rnd = mulberry32(cfg.seed * 7919);
  const stones: Inst[] = [];
  const spires: Inst[] = [];
  const windows: Inst[] = [];
  const glows: Inst[] = [];

  const n = Math.round(cfg.r * cfg.density * densityScale * 0.75);
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2;
    const dist = clear + Math.sqrt(rnd()) * Math.max(0.2, cfg.r * 0.78 - clear);
    const x = Math.cos(a) * dist;
    const z = Math.sin(a) * dist;
    if (corridor && z > 0 && Math.abs(x) < corridor) continue;

    const w = 0.35 + rnd() * 0.55;
    const d = w * (0.8 + rnd() * 0.5);
    const h = (0.6 + rnd() * cfg.r * 0.6) * (1.1 - (dist / cfg.r) * 0.6);
    // Keep camera-facing rim lower so landmarks stay clear
    const hh = z > cfg.r * 0.35 ? h * 0.45 : h;

    // Building base
    stones.push({ p: [x, hh / 2, z], s: [w, hh, d] });
    let top = hh;

    // Terraced stepped roof or decorative dome
    if (rnd() < 0.45) {
      const h2 = hh * 0.35;
      stones.push({ p: [x, hh + h2 / 2, z], s: [w * 0.68, h2, d * 0.68] });
      top += h2;
    }
    if (rnd() < 0.6) {
      const sh = w * (1.2 + rnd() * 1.4);
      spires.push({ p: [x, top + sh / 2, z], s: [w * 0.55, sh, w * 0.55], r: Math.PI / 4 });
    }

    // Warm lit lattice windows
    const rows = Math.floor(hh / 0.32);
    for (let row = 0; row < rows; row++) {
      for (const c of [-1, 1]) {
        if (rnd() < 0.35) {
          const wy = 0.22 + row * 0.32;
          windows.push({ p: [x + c * w * 0.22, wy, z + d / 2 + 0.006], s: [0.08, 0.12, 0.01] });
          if (rnd() < 0.15) glows.push({ p: [x + c * w * 0.22, wy, z + d / 2 + 0.06], s: [0.75, 0.75, 1] });
        }
      }
    }
  }

  // Rim lanterns along pathways
  const lamps = Math.round(cfg.r * 2.6);
  for (let i = 0; i < lamps; i++) {
    const a = (i / lamps) * Math.PI * 2 + rnd() * 0.18;
    const x = Math.cos(a) * cfg.r * 0.96;
    const z = Math.sin(a) * cfg.r * 0.96;
    windows.push({ p: [x, 0.14, z], s: [0.07, 0.14, 0.07] });
    if (z > -cfg.r * 0.2 && rnd() < 0.6) glows.push({ p: [x, 0.22, z + 0.05], s: [0.95, 0.95, 1] });
  }

  // Cliff dwellings on the sunlit rock face
  const dwellings = Math.round(cfg.r * 2.0 * densityScale);
  for (let i = 0; i < dwellings; i++) {
    const t = 0.08 + rnd() * 0.38;
    const rad = cfg.r * (1 - t * 0.88) * 1.04;
    const a = Math.PI / 2 + (rnd() - 0.5) * 1.8;
    const x = Math.cos(a) * rad;
    const z = Math.sin(a) * rad;
    const y = -t * cfg.depth;
    windows.push({ p: [x, y, z], s: [0.09, 0.14, 0.02] });
    if (rnd() < 0.35) glows.push({ p: [x, y, z + 0.08], s: [0.85, 0.85, 1] });
  }

  return { stones, spires, windows, glows };
}

/**
 * Distant majestic mountain ranges, misty ridges and floating archipelago islands
 * silhouetted against the golden horizon.
 */
export function buildDistant(count: number) {
  const rnd = mulberry32(4242);
  const ridges: Inst[] = [];
  const spires: Inst[] = [];
  const glows: Inst[] = [];
  const rocks: Inst[] = [];

  // Majestic distant mountain peaks and mountain ranges across the horizon
  const mountainCount = Math.round(count * 1.2);
  for (let i = 0; i < mountainCount; i++) {
    const x = (rnd() - 0.5) * 440;
    const z = -120 - rnd() * 160;
    if (Math.abs(x) < 16) continue; // keep sun corridor open

    const h = 18 + rnd() * 45;
    const w = 12 + rnd() * 26; // wide majestic mountain silhouette base
    const d = w * (0.8 + rnd() * 0.5);

    // Mountain peak pyramid with wide sloping ridges
    ridges.push({
      p: [x, -20 + h / 2, z],
      s: [w, h, d],
      r: (rnd() - 0.5) * 0.6,
    });

    // Secondary sub-peak on the ridge
    if (rnd() < 0.65) {
      const sh = h * 0.6;
      const sw = w * 0.5;
      const sx = x + (rnd() - 0.5) * w * 0.6;
      ridges.push({
        p: [sx, -20 + sh / 2, z + (rnd() - 0.5) * 10],
        s: [sw, sh, sw],
        r: (rnd() - 0.5) * 0.8,
      });
    }

    // Distant mountain monastery / sanctuary warm glow
    if (rnd() < 0.4) {
      glows.push({ p: [x, -20 + h * 0.7, z + d * 0.4], s: [7, 7, 1] });
    }
  }

  // Floating satellite rocks & miniature islands in the middle fog layer
  const rockCount = Math.round(count * 0.6);
  for (let i = 0; i < rockCount; i++) {
    const sc = 2.2 + rnd() * 5.5;
    const x = (rnd() - 0.5) * 260;
    const z = -55 - rnd() * 95;
    if (Math.abs(x) < 18 && z > -90) continue; // avoid blocking foreground landmarks
    rocks.push({
      p: [x, -6 + rnd() * 32, z],
      s: [sc, sc * (1.2 + rnd() * 0.5), sc],
      r: rnd() * Math.PI * 2,
    });
  }

  return { ridges, spires, glows, rocks };
}

