import { memo } from 'react';
import { Target, Flame, Cpu, CheckCircle } from 'lucide-react';
import { mulberry32 } from '../../lib/rng';

const rnd = mulberry32(808);
const heat = Array.from({ length: 7 * 16 }, () => {
  const v = rnd();
  return v < 0.28 ? 0 : v < 0.55 ? 1 : v < 0.8 ? 2 : v < 0.94 ? 3 : 4;
});
const heatColors = [
  'rgb(255 255 255 / 0.05)',
  'rgb(232 197 138 / 0.22)',
  'rgb(232 197 138 / 0.42)',
  'rgb(232 197 138 / 0.7)',
  '#e8c58a',
];

const platforms = [
  { name: 'LeetCode', value: '370+', tone: '#ffb866' },
  { name: 'Codeforces', value: 'Synced', tone: '#b9a4ff' },
  { name: 'CodeChef', value: 'Synced', tone: '#c9c1b4' },
  { name: 'GitHub', value: 'Live', tone: '#e8c58a' },
];

const workers = ['platform-sync', 'resume-parse', 'ats-score', 'embeddings'];

/**
 * DevTrack developer dashboard, built with HTML, CSS and inline SVG.
 * Illustrative preview showcasing platform telemetry, contribution heatmap,
 * career readiness progress, and BullMQ background workers.
 */
export const DevTrackMock = memo(function DevTrackMock() {
  return (
    <div
      role="img"
      aria-label="DevTrack developer OS illustration: platform sync telemetry, contribution heatmap, career readiness metrics, daily missions, and BullMQ background workers."
      className="overflow-hidden rounded-xl border border-white/[0.07] bg-ink-950/80 text-[0.62rem] text-sand-400"
    >
      {/* Header bar */}
      <div aria-hidden className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <div className="flex flex-1 items-center justify-between ml-2">
          <span className="font-mono text-sand-300">devtrack / mission-control</span>
          <span className="rounded bg-gold-300/10 px-1.5 py-0.5 text-[0.58rem] font-medium text-gold-300 ring-1 ring-gold-300/25">
            23 Route Modules · Monorepo OS
          </span>
        </div>
      </div>

      <div aria-hidden className="p-3 space-y-2.5">
        {/* Top platform sync status row */}
        <div className="grid grid-cols-4 gap-1.5">
          {platforms.map((p) => (
            <div key={p.name} className="rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-center">
              <div className="truncate text-sand-400 text-[0.58rem]">{p.name}</div>
              <div className="mt-0.5 font-mono text-[0.72rem] font-semibold" style={{ color: p.tone }}>
                {p.value}
              </div>
            </div>
          ))}
        </div>

        {/* Heatmap & Readiness Split */}
        <div className="grid grid-cols-[1.1fr_1fr] gap-2">
          {/* Activity Heatmap */}
          <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-2">
            <div className="mb-1.5 flex items-center justify-between text-[0.58rem]">
              <span className="text-sand-300">Activity Telemetry</span>
              <span className="flex items-center gap-1 text-gold-300 font-semibold">
                <Flame size={10} /> 42d streak
              </span>
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-[2px]">
              {heat.map((h, i) => (
                <span key={i} className="aspect-square rounded-[2px]" style={{ background: heatColors[h] }} />
              ))}
            </div>
          </div>

          {/* Career Readiness & Daily Mission */}
          <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[0.58rem]">
                <span className="text-sand-300 flex items-center gap-1">
                  <Target size={10} className="text-gold-300" /> Career Readiness
                </span>
                <span className="font-mono text-gold-300 font-semibold">84%</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-gold-400 to-gold-200" style={{ width: '84%' }} />
              </div>
            </div>

            <div className="mt-2 rounded border border-white/[0.05] bg-white/[0.02] p-1.5">
              <div className="flex items-center justify-between text-[0.56rem]">
                <span className="text-sand-300 flex items-center gap-1 font-semibold">
                  <CheckCircle size={9} className="text-emerald-400" /> Daily Mission
                </span>
                <span className="text-gold-200 font-mono">+120 XP</span>
              </div>
              <p className="mt-0.5 truncate text-[0.54rem] text-sand-400">
                DSA Graph Traversal & AST Cache
              </p>
            </div>
          </div>
        </div>

        {/* BullMQ worker queue indicators */}
        <div className="flex items-center justify-between rounded-md border border-white/[0.05] bg-white/[0.015] px-2 py-1.5">
          <span className="text-[0.58rem] text-sand-400 flex items-center gap-1">
            <Cpu size={10} className="text-sand-300" /> BullMQ Workers:
          </span>
          <div className="flex flex-wrap gap-1">
            {workers.map((w, i) => (
              <span key={w} className="flex items-center gap-1 rounded border border-white/[0.06] px-1.5 py-0.5 text-[0.55rem] font-mono">
                <span
                  className={`size-1.5 rounded-full ${
                    i === 0 ? 'animate-pulse-soft bg-gold-300' : 'bg-emerald-400/80'
                  }`}
                />
                {w}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Caption footer */}
      <div aria-hidden className="flex items-center justify-between border-t border-white/[0.04] px-3 py-1 bg-ink-950 text-[0.56rem] text-sand-500">
        <span>Illustrative interface preview</span>
        <span>SSE streaming · 60+ MongoDB schemas</span>
      </div>
    </div>
  );
});
