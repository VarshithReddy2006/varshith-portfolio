import { memo } from 'react';
import { Lock, ShieldAlert, Zap, Cpu } from 'lucide-react';

const features = [
  { name: 'Lookalike brand token', v: 0.94 },
  { name: 'Suspicious TLD pattern', v: 0.78 },
  { name: 'Subdomain depth & entropy', v: 0.65 },
  { name: 'Homograph Punycode check', v: 0.58 },
  { name: 'Sensitive path keyword', v: 0.48 },
];

const RISK = 0.92;
const R = 34;
const C = Math.PI * R;

/**
 * PhishGuard AI security console preview, built with HTML, CSS and inline SVG.
 * Illustrative preview showcasing URL lexical breakdown, risk score gauge,
 * 58-feature signal ranking, and localhost in-memory model status.
 */
export const PhishGuardMock = memo(function PhishGuardMock() {
  return (
    <div
      role="img"
      aria-label="PhishGuard AI security console illustration: URL lexical interception, 92 percent risk gauge, 58 engineered features breakdown, and a sub-15 ms local inference design target."
      className="overflow-hidden rounded-xl border border-white/[0.07] bg-ink-950/80 text-[0.62rem] text-sand-400"
    >
      {/* Browser address bar */}
      <div aria-hidden className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <div className="flex h-4 flex-1 items-center gap-1.5 rounded bg-red-400/[0.08] px-2 text-red-200/90 ring-1 ring-red-400/30 overflow-hidden">
          <Lock size={9} className="shrink-0 text-red-400" />
          <span className="truncate font-mono text-[0.58rem]">
            https://secure-login.<strong className="text-red-300">paypa1-verify</strong>.com/account/login
          </span>
        </div>
      </div>

      {/* Main split */}
      <div aria-hidden className="grid grid-cols-[6.5rem_1fr] gap-3 p-3">
        {/* Risk Gauge */}
        <div className="flex flex-col items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] p-2">
          <svg viewBox="0 0 80 46" className="w-full">
            <path
              d={`M6,40 A${R},${R} 0 0 1 74,40`}
              fill="none"
              stroke="rgb(255 255 255 / 0.08)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <path
              d={`M6,40 A${R},${R} 0 0 1 74,40`}
              fill="none"
              stroke="url(#pg-risk-grad)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${C * RISK} ${C}`}
            />
            <defs>
              <linearGradient id="pg-risk-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="#e8c58a" />
                <stop offset="1" stopColor="#f87171" />
              </linearGradient>
            </defs>
            <text
              x="40"
              y="38"
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="#f5efe6"
              style={{ fontFamily: 'inherit' }}
            >
              92%
            </text>
          </svg>
          <span className="mt-1 flex items-center gap-1 font-semibold text-red-300 text-[0.58rem]">
            <ShieldAlert size={10} /> Phishing Flagged
          </span>
        </div>

        {/* Top 58 Features signals */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-1">
            <span className="text-sand-300 font-semibold text-[0.58rem]">Top Signals · 58 Features</span>
            <span className="text-[0.56rem] text-gold-300 font-mono">Gradient Boosting</span>
          </div>
          {features.map((f) => (
            <div key={f.name} className="grid grid-cols-[5.8rem_1fr] items-center gap-2">
              <span className="truncate text-sand-400 text-[0.56rem]">{f.name}</span>
              <span className="h-1.5 overflow-hidden rounded bg-white/[0.06]">
                <span
                  className="block h-full rounded bg-gradient-to-r from-gold-300/70 to-red-400/90"
                  style={{ width: `${f.v * 100}%` }}
                />
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Local model telemetry bar */}
      <div aria-hidden className="flex items-center justify-between border-t border-white/[0.06] bg-ink-900/60 px-3 py-1.5 font-mono text-[0.56rem]">
        <span className="flex items-center gap-1 text-sand-300">
          <Zap size={9} className="text-gold-300" />
          Latency target: <strong className="text-gold-200">&lt;15 ms</strong> (<span className="text-sand-400">not yet benchmarked</span>)
        </span>
        <span className="flex items-center gap-1 text-emerald-400">
          <Cpu size={9} />
          <span className="size-1.5 animate-pulse-soft rounded-full bg-emerald-400" />
          Hot-swap in-memory weights
        </span>
      </div>

      {/* Footer disclaimer */}
      <div aria-hidden className="flex items-center justify-between border-t border-white/[0.04] px-3 py-1 bg-ink-950 text-[0.54rem] text-sand-500">
        <span>Sample URL evaluation preview</span>
        <span>README-reported 90.83% accuracy · 11,438-URL dataset</span>
      </div>
    </div>
  );
});
