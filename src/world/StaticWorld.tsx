/**
 * Static, code-generated version of the world (inline SVG + CSS gradients).
 * Painted instantly while the WebGL world loads, and used permanently when
 * WebGL is unavailable or Save-Data is on. It supports the same navigation:
 * clickable landmarks, positioned labels, and a CSS "camera" that zooms
 * toward the selected landmark beside the open panel.
 */
import { memo, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from 'react';
import { mulberry32 } from '../lib/rng';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { landmarks, type LandmarkId } from './landmarks';
import { hover, isPanelOpen, registry, select, world, useWorld } from './store';
import { layoutLabels } from './labels';

const VW = 1600;
const VH = 900;

interface Isle {
  cx: number;
  top: number;
  w: number;
  depth: number;
  /** Label anchor in viewBox units. */
  anchor: [number, number];
  /** Focus point for the CSS camera. */
  focus: [number, number];
  seed: number;
}

export const isles: Record<LandmarkId, Isle> = {
  home: { cx: 800, top: 640, w: 430, depth: 250, anchor: [800, 652], focus: [800, 560], seed: 23 },
  about: { cx: 390, top: 385, w: 210, depth: 130, anchor: [362, 270], focus: [390, 300], seed: 17 },
  projects: { cx: 1105, top: 370, w: 270, depth: 160, anchor: [1205, 280], focus: [1105, 300], seed: 11 },
  experience: { cx: 1395, top: 480, w: 190, depth: 110, anchor: [1395, 405], focus: [1395, 450], seed: 13 },
  achievements: { cx: 225, top: 570, w: 210, depth: 120, anchor: [225, 478], focus: [225, 530], seed: 29 },
  contact: { cx: 1320, top: 712, w: 175, depth: 100, anchor: [1262, 680], focus: [1320, 680], seed: 31 },
};

function rockPoints(d: Isle) {
  const rnd = mulberry32(d.seed);
  const pts: [number, number][] = [
    [d.cx - d.w / 2, d.top],
    [d.cx + d.w / 2, d.top],
  ];
  const steps = 7;
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    pts.push([d.cx + (d.w / 2) * (1 - t) * (0.82 + rnd() * 0.36), d.top + d.depth * t * (0.94 + rnd() * 0.08)]);
  }
  pts.push([d.cx + (rnd() - 0.5) * d.w * 0.12, d.top + d.depth]);
  for (let i = steps - 1; i >= 1; i--) {
    const t = i / steps;
    pts.push([d.cx - (d.w / 2) * (1 - t) * (0.82 + rnd() * 0.36), d.top + d.depth * t * (0.94 + rnd() * 0.08)]);
  }
  return pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
}

/** Small generic buildings across an island, skipping its landmark core. */
function cityRects(d: Isle, clear: number, s: number) {
  const rnd = mulberry32(d.seed * 31);
  const out: { x: number; y: number; w: number; h: number; spire: number; lit: [number, number][] }[] = [];
  const n = Math.round(d.w / 16);
  for (let i = 0; i < n; i++) {
    const off = (rnd() * 2 - 1) * d.w * 0.42;
    if (Math.abs(off) < clear) continue;
    const bw = (7 + rnd() * 12) * s;
    const bh = (18 + rnd() * 50) * s * (1.1 - Math.abs(off) / d.w);
    const x = d.cx + off - bw / 2;
    const lit: [number, number][] = [];
    for (let wy = d.top - bh + 5; wy < d.top - 4; wy += 7 * s) if (rnd() < 0.35) lit.push([x + bw * (0.25 + rnd() * 0.5), wy]);
    out.push({ x, y: d.top - bh, w: bw, h: bh, spire: rnd() < 0.6 ? bw * 1.6 : 0, lit });
  }
  return out;
}

const STONE = '#1f1b18';
const LIT = '#ffcf8a';

function Building({ id }: { id: LandmarkId }) {
  const d = isles[id];
  const { cx, top } = d;
  switch (id) {
    case 'home':
      return (
        <g>
          <circle cx={cx} cy={top - 110} r="170" fill="url(#sw-glow)" />
          {[-130, -95, -60, 60, 95, 130].map((dx, i) => (
            <rect key={i} x={cx + dx - 11} y={top - 170 - (i % 3) * 45} width="22" height={170 + (i % 3) * 45} fill="#1a1714" />
          ))}
          <g fill={STONE}>
            <rect x={cx - 82} y={top - 215} width="24" height="215" />
            <rect x={cx + 58} y={top - 215} width="24" height="215" />
            <rect x={cx - 100} y={top - 238} width="200" height="24" />
            <rect x={cx - 70} y={top - 256} width="140" height="18" />
            <polygon points={`${cx - 12},${top - 256} ${cx + 12},${top - 256} ${cx},${top - 288}`} />
          </g>
          <rect className="sw-accent" x={cx - 72} y={top - 205} width="3" height="195" />
          <rect className="sw-accent" x={cx + 69} y={top - 205} width="3" height="195" />
          <g transform={`translate(${cx} ${top - 112})`}>
            <polygon points="0,-34 29,-17 29,17 0,34 -29,17 -29,-17" fill="none" stroke="#e8c58a" strokeOpacity="0.6" />
            <ellipse rx="50" ry="14" fill="none" stroke="#e8c58a" strokeWidth="1.4" transform="rotate(-18)" />
            <ellipse rx="60" ry="20" fill="none" stroke="#f5dcae" strokeOpacity="0.55" transform="rotate(28)" />
            <polygon points="0,-14 10,0 0,14 -10,0" fill="#ffe6b8" />
          </g>
          <rect x={cx - 6} y={top - 2} width="12" height="40" fill={LIT} opacity="0.7" />
        </g>
      );
    case 'about':
      return (
        <g>
          {[
            [46, 34],
            [36, 32],
            [28, 30],
            [20, 24],
          ].reduce<{ y: number; els: ReactNode[] }>(
            (acc, [w, h], i) => {
              const y = acc.y - h;
              acc.els.push(
                <g key={i}>
                  <rect x={cx - w / 2} y={y} width={w} height={h} fill={STONE} />
                  <rect className="sw-accent" x={cx - w / 2 - 2} y={y - 2} width={w + 4} height="2.5" />
                  <rect x={cx - 2} y={y + 6} width="4" height={h - 12} fill={LIT} opacity="0.8" />
                </g>,
              );
              acc.y = y;
              return acc;
            },
            { y: top, els: [] },
          ).els}
          <polygon points={`${cx - 8},${top - 120} ${cx + 8},${top - 120} ${cx},${top - 138}`} fill={STONE} />
          <circle cx={cx} cy={top - 150} r="7" fill="#ffe2b0" />
          <circle cx={cx} cy={top - 150} r="30" fill="url(#sw-glow)" />
          <ellipse cx={cx} cy={top - 150} rx="18" ry="6" fill="none" stroke="#e8c58a" transform={`rotate(-20 ${cx} ${top - 150})`} />
        </g>
      );
    case 'projects':
      return (
        <g fill={STONE}>
          <rect x={cx - 14} y={top - 165} width="28" height="165" />
          <rect className="sw-accent" x={cx - 1.5} y={top - 160} width="3" height="150" />
          <g transform={`translate(${cx} ${top - 182})`} stroke="#e8c58a" strokeOpacity="0.6" fill="none">
            <path d="M-26,0 L-8,-12 L10,-4 L26,-14 M-8,-12 L4,12 L22,8 M-26,0 L4,12" />
            {[
              [-26, 0],
              [-8, -12],
              [10, -4],
              [26, -14],
              [4, 12],
              [22, 8],
            ].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r="2.6" fill="#ffd9a0" stroke="none" />
            ))}
          </g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect key={i} x={cx + 52 - i * 3} y={top - 22 - i * 20} width={36 - i * 4} height="18" />
          ))}
          {[0, 1, 2].map((i) => (
            <rect key={i} x={cx - 92 + i * 7} y={top - 20 - i * 20} width={40 - i * 12} height="20" />
          ))}
          <rect x={cx - 14} y={top - 26} width="34" height="26" />
          <path d={`M${cx - 18},${top - 26} a21,21 0 0 1 42,0`} fill="none" stroke="#e8c58a" strokeOpacity="0.6" />
          <rect x={cx - 60} y={top - 70} width="50" height="2" fill={LIT} />
          <rect x={cx + 14} y={top - 84} width="40" height="2" fill={LIT} />
        </g>
      );
    case 'experience':
      return (
        <g fill={STONE}>
          <rect x={cx - 60} y={top - 8} width="120" height="8" />
          <rect x={cx - 52} y={top - 52} width="104" height="44" />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <rect key={i} x={cx - 48 + i * 18} y={top - 54} width="5" height="46" fill="#2a2420" />
          ))}
          <rect x={cx - 58} y={top - 60} width="116" height="7" />
          <polygon points={`${cx - 60},${top - 60} ${cx + 60},${top - 60} ${cx},${top - 84}`} />
          <rect x={cx - 9} y={top - 40} width="18" height="32" fill={LIT} opacity="0.85" />
          <rect className="sw-accent" x={cx - 58} y={top - 62} width="116" height="2" />
        </g>
      );
    case 'achievements':
      return (
        <g>
          <rect x={cx - 52} y={top - 8} width="104" height="8" fill="#2a2420" />
          <rect x={cx - 38} y={top - 16} width="76" height="8" fill={STONE} />
          <rect x={cx - 24} y={top - 24} width="48" height="8" fill="#2a2420" />
          {[-44, -26, 26, 44].map((dx) => (
            <polygon key={dx} points={`${cx + dx - 5},${top - 8} ${cx + dx + 5},${top - 8} ${cx + dx},${top - 64}`} fill={STONE} />
          ))}
          <path
            d={`M${cx - 6},${top - 24} L${cx - 4},${top - 44} Q${cx - 20},${top - 52} ${cx - 18},${top - 80} L${cx + 18},${top - 80} Q${cx + 20},${top - 52} ${cx + 4},${top - 44} L${cx + 6},${top - 24} Z`}
            fill="#c8954a"
          />
          <circle cx={cx} cy={top - 60} r="40" fill="url(#sw-glow)" />
        </g>
      );
    case 'contact':
      return (
        <g>
          <rect x={cx - 34} y={top - 8} width="68" height="8" fill={STONE} />
          <circle cx={cx} cy={top - 38} r="26" fill="url(#sw-glow)" />
          <circle className="sw-accent-stroke" cx={cx} cy={top - 38} r="24" fill="none" strokeWidth="5" />
          <rect x={cx + 36} y={top - 70} width="3" height="62" fill={STONE} />
          <circle cx={cx + 37.5} cy={top - 72} r="3" fill="#fff1d6" />
          <circle cx={cx + 37.5} cy={top - 72} r="10" fill="none" stroke="#ffe2b0" strokeOpacity="0.5" className="animate-pulse-soft" />
        </g>
      );
  }
}

function useSceneData() {
  return useMemo(() => {
    const rnd = mulberry32(2024);
    const spires = Array.from({ length: 46 }, () => {
      const w = 8 + rnd() * 18;
      const h = 90 + rnd() * 220;
      return { x: rnd() * VW, w, h, tip: w * (2 + rnd() * 3), lit: rnd() < 0.4 };
    }).filter((s) => Math.abs(s.x - 800) > 60);
    const backClouds = Array.from({ length: 26 }, () => ({ x: rnd() * VW, y: 600 + rnd() * 110, rx: 120 + rnd() * 200, ry: 16 + rnd() * 26 }));
    const frontClouds = Array.from({ length: 30 }, () => ({ x: rnd() * VW, y: 790 + rnd() * 130, rx: 140 + rnd() * 260, ry: 26 + rnd() * 46 }));
    const stars = Array.from({ length: 70 }, () => ({ x: rnd() * VW, y: rnd() * 260, r: 0.5 + rnd() * 0.9, o: 0.25 + rnd() * 0.5 }));
    const debris = Array.from({ length: 22 }, () => ({ x: rnd() * VW, y: 120 + rnd() * 420, w: 18 + rnd() * 40 }));
    const cities = Object.fromEntries(
      (Object.keys(isles) as LandmarkId[]).map((id) => {
        const d = isles[id];
        return [id, cityRects(d, id === 'home' ? 150 : d.w * 0.28, id === 'home' ? 1 : 0.7)];
      }),
    ) as Record<LandmarkId, ReturnType<typeof cityRects>>;
    const paths = landmarks
      .filter((l) => l.id !== 'home')
      .map((l, i) => {
        const a = isles.home;
        const b = isles[l.id];
        const sx = b.cx < a.cx ? a.cx - a.w * 0.42 : a.cx + a.w * 0.42;
        const ex = b.cx < a.cx ? b.cx + b.w * 0.4 : b.cx - b.w * 0.4;
        const my = Math.max(a.top, b.top) + 40 + (i % 2) * 25;
        return { id: l.id, d: `M${sx},${a.top + 4} C${(sx + ex) / 2},${my} ${(sx + ex) / 2},${my} ${ex},${b.top + 2}` };
      });
    return { spires, backClouds, frontClouds, stars, debris, cities, paths };
  }, []);
}

const nearSun = (x: number) => Math.exp(-Math.pow((x - 800) / 380, 2));

const WorldSvg = memo(function WorldSvg() {
  const sc = useSceneData();
  return (
    <svg viewBox={`0 0 ${VW} ${VH}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <linearGradient id="sw-rock" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a3f35" />
          <stop offset="0.35" stopColor="#2a241f" />
          <stop offset="1" stopColor="#100e0c" />
        </linearGradient>
        <radialGradient id="sw-glow">
          <stop offset="0" stopColor="#ffd9a0" stopOpacity="0.9" />
          <stop offset="0.3" stopColor="#ffb866" stopOpacity="0.35" />
          <stop offset="1" stopColor="#ffb866" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sw-cloud-shade">
          <stop offset="0" stopColor="#5b4f44" stopOpacity="0.7" />
          <stop offset="1" stopColor="#5b4f44" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sw-cloud-lit">
          <stop offset="0" stopColor="#c99863" stopOpacity="0.65" />
          <stop offset="1" stopColor="#c99863" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="sw-planet" cx="0.35" cy="0.3">
          <stop offset="0" stopColor="#5a4a3b" />
          <stop offset="0.6" stopColor="#231d18" />
          <stop offset="1" stopColor="#0f0d0b" />
        </radialGradient>
        <linearGradient id="sw-haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.35" stopColor="#261f19" stopOpacity="0" />
          <stop offset="1" stopColor="#261f19" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {sc.stars.map((s, i) => (
        <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#f5efe6" opacity={s.o} />
      ))}

      {/* Ringed planet */}
      <circle cx="810" cy="150" r="190" fill="url(#sw-glow)" opacity="0.5" />
      <circle cx="810" cy="150" r="112" fill="url(#sw-planet)" />
      <g transform="rotate(-10 810 150)">
        <ellipse cx="810" cy="150" rx="230" ry="44" fill="none" stroke="#e8c58a" strokeOpacity="0.55" strokeWidth="2" />
        <ellipse cx="810" cy="150" rx="265" ry="54" fill="none" stroke="#8a6a43" strokeOpacity="0.25" strokeWidth="9" />
      </g>
      <circle cx="1140" cy="560" r="26" fill="url(#sw-planet)" />

      <g fill="#1d1916" opacity="0.9">
        {sc.spires.map((s, i) => (
          <g key={i}>
            <rect x={s.x} y={660 - s.h} width={s.w} height={s.h} />
            <polygon points={`${s.x},${660 - s.h} ${s.x + s.w},${660 - s.h} ${s.x + s.w / 2},${660 - s.h - s.tip}`} />
            {s.lit && <circle cx={s.x + s.w / 2} cy={660 - s.h - s.tip * 0.2} r="1.6" fill={LIT} opacity="0.8" />}
          </g>
        ))}
      </g>
      <rect x="0" y="300" width={VW} height="380" fill="url(#sw-haze)" />
      <circle cx="800" cy="520" r="430" fill="url(#sw-glow)" opacity="0.45" />

      {sc.debris.map((d, i) => (
        <polygon key={i} points={`${d.x},${d.y} ${d.x + d.w},${d.y} ${d.x + d.w * 0.55},${d.y + d.w * 0.8}`} fill="#2a241f" opacity="0.7" />
      ))}

      {sc.backClouds.map((c, i) => (
        <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={nearSun(c.x) > 0.4 ? 'url(#sw-cloud-lit)' : 'url(#sw-cloud-shade)'} />
      ))}

      {/* Golden paths */}
      <g fill="none" strokeLinecap="round">
        {sc.paths.map((p) => (
          <g key={p.id} data-path={p.id}>
            <path d={p.d} stroke="#ffb866" strokeOpacity="0.18" strokeWidth="8" />
            <path d={p.d} stroke="#f2c786" strokeWidth="1.6" className="sw-path" />
          </g>
        ))}
        <ellipse cx="800" cy="676" rx="520" ry="60" stroke="#f2c786" strokeWidth="1.6" strokeOpacity="0.8" />
      </g>

      {landmarks.map((l) => {
        const d = isles[l.id];
        return (
          <g
            key={l.id}
            data-lm={l.id}
            className="sw-lm cursor-pointer"
            onClick={() => select(l.id)}
            onPointerEnter={() => hover(l.id)}
            onPointerLeave={() => world.get().hovered === l.id && hover(null)}
          >
            <polygon points={rockPoints(d)} fill="url(#sw-rock)" />
            <rect x={d.cx - d.w / 2} y={d.top - 4} width={d.w} height="6" fill="#4c4339" />
            <line x1={d.cx - d.w / 2} y1={d.top - 4} x2={d.cx + d.w / 2} y2={d.top - 4} stroke="#e8c58a" strokeOpacity="0.7" strokeWidth="1.2" />
            {sc.cities[l.id].map((b, i) => (
              <g key={i} fill={STONE}>
                <rect x={b.x} y={b.y} width={b.w} height={b.h} />
                {b.spire > 0 && <polygon points={`${b.x},${b.y} ${b.x + b.w},${b.y} ${b.x + b.w / 2},${b.y - b.spire}`} />}
                {b.lit.map(([wx, wy], j) => (
                  <rect key={j} x={wx} y={wy} width="2" height="3.2" fill={LIT} />
                ))}
              </g>
            ))}
            <Building id={l.id} />
            <ellipse className="sw-ring" cx={d.cx} cy={d.top} rx={d.w * 0.55} ry={d.w * 0.09} fill="none" stroke="#f2c786" strokeWidth="2" />
          </g>
        );
      })}

      {/* Foreground observation platform */}
      <g>
        <ellipse cx="800" cy="905" rx="330" ry="78" fill="#15120f" />
        {[300, 240, 175, 110, 50].map((rx, i) => (
          <ellipse key={rx} cx="800" cy="900" rx={rx} ry={rx * 0.22} fill="none" stroke={i % 2 ? LIT : '#c9955a'} strokeOpacity={i % 2 ? 0.75 : 0.5} strokeWidth="1.5" />
        ))}
        <ellipse cx="800" cy="900" rx="40" ry="10" fill="url(#sw-glow)" />
      </g>

      {sc.frontClouds.map((c, i) => (
        <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill={nearSun(c.x) > 0.5 ? 'url(#sw-cloud-lit)' : 'url(#sw-cloud-shade)'} />
      ))}
    </svg>
  );
});

interface Fit {
  scale: number;
  ox: number;
  oy: number;
}

/** "Cover" fit on landscape; on portrait, a wider fit anchored under the nav. */
function fitFor(w: number, h: number): Fit {
  if (w / h >= 0.9) {
    const scale = Math.max(w / VW, h / VH);
    return { scale, ox: (w - VW * scale) / 2, oy: (h - VH * scale) / 2 };
  }
  const scale = Math.max(w / 1150, (h * 0.62) / VH);
  return { scale, ox: (w - VW * scale) / 2, oy: 64 - 90 * scale };
}

export function StaticWorld({ hidden = false }: { hidden?: boolean }) {
  const reduced = usePrefersReducedMotion();
  const stage = useRef<HTMLDivElement>(null);
  const active = useWorld((s) => s.active);
  const hovered = useWorld((s) => s.hovered);
  const open = useWorld(isPanelOpen);
  const tour = useWorld((s) => s.tour);
  const mode = useWorld((s) => s.mode);
  const fit = useRef<Fit>({ scale: 1, ox: 0, oy: 0 });
  const cam = useRef({ z: 1, tx: 0, ty: 0 });

  // Highlight the active / hovered landmark.
  useEffect(() => {
    stage.current?.querySelectorAll<SVGGElement>('[data-lm]').forEach((g) => {
      const id = g.dataset.lm as LandmarkId;
      g.dataset.on = id === active && id !== 'home' ? '2' : id === hovered ? '1' : '0';
    });
    stage.current?.querySelectorAll<SVGGElement>('[data-path]').forEach((g) => {
      g.dataset.on = g.dataset.path === active || g.dataset.path === hovered ? '1' : '0';
    });
  }, [active, hovered]);

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const apply = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const f = fitFor(w, h);
      fit.current = f;
      el.style.left = `${f.ox}px`;
      el.style.top = `${f.oy}px`;
      el.style.width = `${VW * f.scale}px`;
      el.style.height = `${VH * f.scale}px`;

      // CSS camera: zoom toward the selected landmark beside the panel.
      const s = world.get();
      const focusId = s.active;
      let c = { z: 1, tx: 0, ty: 0 };
      if (focusId !== 'home') {
        const pb = isPanelOpen(s) ? registry.panelBox : null;
        const cx = pb?.side === 'right' ? (w - pb.size) / 2 : w / 2;
        const cy = pb?.side === 'bottom' ? Math.max(120, (h - pb.size) / 2 + 30) : h / 2;
        const z = w / h < 0.9 ? 1.35 : 1.7;
        const [fx, fy] = isles[focusId].focus;
        const sx = f.ox + fx * f.scale;
        const sy = f.oy + fy * f.scale;
        // translate applies after scaling around the stage's own origin.
        c = { z, tx: cx - f.ox - z * (sx - f.ox), ty: cy - f.oy - z * (sy - f.oy) };
      }
      cam.current = c;
      el.style.transform = `translate(${c.tx}px, ${c.ty}px) scale(${c.z})`;

      if (world.get().mode !== 'static') return;
      layoutLabels(
        landmarks.map((l) => {
          const [ax, ay] = isles[l.id].anchor;
          return {
            id: l.id,
            x: f.ox + c.tx + ax * f.scale * c.z,
            y: f.oy + c.ty + ay * f.scale * c.z,
            ok: true,
          };
        }),
        w,
        h,
      );
    };
    apply();
    // Panels measure themselves after opening; re-run once they settle.
    const t = setTimeout(apply, 60);
    window.addEventListener('resize', apply);
    window.addEventListener('world:layout', apply);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', apply);
      window.removeEventListener('world:layout', apply);
    };
  }, [active, hovered, open, tour, mode]);

  return (
    <div
      aria-hidden
      className={`absolute inset-0 overflow-hidden transition-opacity duration-[1400ms] ${hidden ? 'opacity-0' : 'opacity-100'}`}
      style={{
        background:
          'radial-gradient(45% 38% at 50% 58%, rgb(255 190 110 / 0.30), transparent 70%), linear-gradient(to bottom, #050506 0%, #0e0d0d 26%, #241c15 46%, #5a3f24 60%, #2a2119 70%, #0b0a09 100%)',
      }}
    >
      <div
        ref={stage}
        className="sw-stage absolute origin-top-left"
        style={{ transition: reduced ? 'none' : 'transform 1.5s cubic-bezier(0.65, 0, 0.35, 1)' }}
      >
        <WorldSvg />
      </div>
    </div>
  );
}
