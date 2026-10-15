import * as THREE from 'three';
import { mulberry32 } from '../../lib/rng';

export { mulberry32 };

/** Position hash: coincident vertices receive identical offsets (no cracks). */
export function hash3(x: number, y: number, z: number, seed: number) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.19) * 43758.5453;
  return s - Math.floor(s);
}

/** Soft radial dot used for glows, lamps and particles (drawn on a canvas, no image files). */
export function makeGlowTexture(size = 64) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.18, 'rgba(255,255,255,0.75)');
  g.addColorStop(0.45, 'rgba(255,255,255,0.18)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Billowy cloud puff built from overlapping radial gradients. */
export function makeCloudTexture(seed = 7) {
  const w = 256;
  const h = 128;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const rnd = mulberry32(seed);
  for (let i = 0; i < 26; i++) {
    const t = i / 25;
    const x = w * (0.18 + 0.64 * t + (rnd() - 0.5) * 0.12);
    const y = h * (0.58 + (rnd() - 0.5) * 0.22 - Math.sin(t * Math.PI) * 0.12);
    const r = h * (0.16 + rnd() * 0.22) * (0.6 + Math.sin(t * Math.PI) * 0.6);
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,255,255,0.5)');
    g.addColorStop(0.55, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // Fade the bottom edge so puffs sit on a flat base.
  ctx.globalCompositeOperation = 'destination-in';
  const fade = ctx.createLinearGradient(0, 0, 0, h);
  fade.addColorStop(0, 'rgba(0,0,0,1)');
  fade.addColorStop(0.75, 'rgba(0,0,0,1)');
  fade.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fade;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Vertical light streaks for waterfalls / light-falls (tileable on Y). */
export function makeStreakTexture(seed = 13) {
  const w = 64;
  const h = 256;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d')!;
  const rnd = mulberry32(seed);
  for (let i = 0; i < 40; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const len = 30 + rnd() * 120;
    const g = ctx.createLinearGradient(0, y, 0, y + len);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, `rgba(255,255,255,${0.25 + rnd() * 0.5})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    const lw = 1 + rnd() * 3;
    ctx.fillRect(x, y, lw, len);
    ctx.fillRect(x, y - h, lw, len); // wrap for seamless tiling
  }
  // Soft horizontal falloff so the fall has no hard edges.
  ctx.globalCompositeOperation = 'destination-in';
  const fx = ctx.createLinearGradient(0, 0, w, 0);
  fx.addColorStop(0, 'rgba(0,0,0,0)');
  fx.addColorStop(0.3, 'rgba(0,0,0,1)');
  fx.addColorStop(0.7, 'rgba(0,0,0,1)');
  fx.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = fx;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Seamless natural noise texture for realistic rock and terrain bump mapping. */
export function makeNoiseTexture(size = 256, seed = 42) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  const data = img.data;
  const rnd = mulberry32(seed);

  // Generate multi-octave 2D value noise
  const grid = new Float32Array(32 * 32);
  for (let i = 0; i < grid.length; i++) grid[i] = rnd();

  const sample = (x: number, y: number, scale: number) => {
    const gx = ((x * scale) % 32 + 32) % 32;
    const gy = ((y * scale) % 32 + 32) % 32;
    const x0 = Math.floor(gx), y0 = Math.floor(gy);
    const x1 = (x0 + 1) % 32, y1 = (y0 + 1) % 32;
    const fx = gx - x0, fy = gy - y0;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const top = grid[y0 * 32 + x0] * (1 - sx) + grid[y0 * 32 + x1] * sx;
    const bot = grid[y1 * 32 + x0] * (1 - sx) + grid[y1 * 32 + x1] * sx;
    return top * (1 - sy) + bot * sy;
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size, ny = y / size;
      const v =
        sample(nx, ny, 1) * 0.5 +
        sample(nx, ny, 2) * 0.25 +
        sample(nx, ny, 4) * 0.15 +
        sample(nx, ny, 8) * 0.1;
      const val = Math.min(255, Math.max(0, Math.floor(v * 255)));
      const idx = (y * size + x) * 4;
      data[idx] = val;
      data[idx + 1] = val;
      data[idx + 2] = val;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

/** Seamless natural mossy grass texture with organic flecks and color depth. */
export function makeGrassTexture(size = 256, seed = 88) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const rnd = mulberry32(seed);

  // Base lush alpine meadow gradient
  ctx.fillStyle = '#2f3b1e';
  ctx.fillRect(0, 0, size, size);

  // Micro-clumps of moss and golden wildflowers
  for (let i = 0; i < 400; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    const r = 1 + rnd() * 3.5;
    const hue = rnd() < 0.35 ? '#4b5f2a' : rnd() < 0.7 ? '#3a4a22' : '#69742e';
    ctx.fillStyle = hue;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Golden wildflower flecks
  for (let i = 0; i < 70; i++) {
    const x = rnd() * size;
    const y = rnd() * size;
    ctx.fillStyle = rnd() < 0.6 ? '#d4af37' : '#e6be65';
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Translucent cascading waterfall texture with turbulent foam streams. */
export function makeWaterTexture(size = 256, seed = 55) {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = size;
  const ctx = c.getContext('2d')!;
  const rnd = mulberry32(seed);

  ctx.fillStyle = 'rgba(180, 220, 240, 0.45)';
  ctx.fillRect(0, 0, 128, size);

  // Flowing frothy white ribbons
  for (let i = 0; i < 60; i++) {
    const x = rnd() * 128;
    const y = rnd() * size;
    const len = 35 + rnd() * 80;
    const g = ctx.createLinearGradient(0, y, 0, y + len);
    g.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    g.addColorStop(0.5, `rgba(255, 255, 255, ${0.4 + rnd() * 0.5})`);
    g.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, 2 + rnd() * 4, len);
    ctx.fillRect(x, y - size, 2 + rnd() * 4, len);
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Soft billowy mist sprite texture for waterfalls and atmospheric sea. */
export function makeMistTexture(size = 128) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
  g.addColorStop(0.35, 'rgba(235, 242, 250, 0.45)');
  g.addColorStop(0.7, 'rgba(220, 230, 245, 0.12)');
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

