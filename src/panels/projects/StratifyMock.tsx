import { memo } from 'react';
import { CheckCircle2, FileText, ShieldCheck, Scale, ArrowRight } from 'lucide-react';

/**
 * Stratify trade operations interface, built with HTML, CSS and inline SVG.
 * Illustrative preview showcasing document parsing, deterministic validation,
 * HS tariff calculation, and audit ledger progression.
 */
export const StratifyMock = memo(function StratifyMock() {
  return (
    <div
      role="img"
      aria-label="Stratify trade operations illustration: commercial invoice document extraction, deterministic math validation, HS tariff duty calculation, and compliance audit timeline."
      className="overflow-hidden rounded-xl border border-white/[0.07] bg-ink-950/80 text-[0.62rem] text-sand-400"
    >
      {/* Window bar */}
      <div aria-hidden className="flex items-center gap-2 border-b border-white/[0.06] px-3 py-2">
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <span className="size-2 rounded-full bg-white/15" />
        <div className="flex flex-1 items-center justify-between">
          <span className="flex items-center gap-1.5 font-mono text-sand-300">
            <FileText size={11} className="text-gold-300" />
            stratify / dossier / INV-2026-8842.pdf
          </span>
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[0.58rem] font-medium text-emerald-300 ring-1 ring-emerald-500/25">
            Sample Fixture · 99.4% Field Conf
          </span>
        </div>
      </div>

      {/* Main operational grid */}
      <div aria-hidden className="grid grid-cols-[1.1fr_1fr] gap-2.5 p-3">
        {/* Left: Extracted Document Fields with Bounding Box simulation */}
        <div className="space-y-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-1.5">
            <span className="font-semibold text-sand-200">Commercial Invoice Data</span>
            <span className="text-[0.58rem] text-sand-500">PaddleOCR Spatial</span>
          </div>

          <div className="space-y-1 font-mono">
            <div className="flex items-center justify-between rounded bg-white/[0.03] px-2 py-1 ring-1 ring-gold-300/20">
              <span className="text-sand-400">Shipper</span>
              <span className="font-semibold text-sand-100">Shenzhen Tech Ltd</span>
            </div>
            <div className="flex items-center justify-between rounded bg-white/[0.02] px-2 py-1">
              <span className="text-sand-400">Consignee</span>
              <span className="text-sand-200">Rotterdam Hub B.V.</span>
            </div>
            <div className="flex items-center justify-between rounded bg-white/[0.03] px-2 py-1 ring-1 ring-gold-300/20">
              <span className="text-sand-400">Declared Value</span>
              <span className="font-semibold text-gold-200">€84,500.00 CIF</span>
            </div>
            <div className="flex items-center justify-between rounded bg-white/[0.02] px-2 py-1">
              <span className="text-sand-400">Incoterm</span>
              <span className="text-emerald-300">CIF Rotterdam 2020</span>
            </div>
            <div className="flex items-center justify-between rounded bg-white/[0.02] px-2 py-1">
              <span className="text-sand-400">HS Code</span>
              <span className="font-semibold text-sand-100">8471.30.00 (DPUs)</span>
            </div>
          </div>
        </div>

        {/* Right: Deterministic Validation & Compliance Checks */}
        <div className="space-y-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
          <div className="flex items-center justify-between border-b border-white/[0.05] pb-1.5">
            <span className="font-semibold text-sand-200">Compliance & Calculations</span>
            <span className="text-[0.58rem] text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={10} /> Deterministic
            </span>
          </div>

          <div className="space-y-1.5 pt-0.5">
            {/* Math check */}
            <div className="rounded border border-emerald-500/20 bg-emerald-500/[0.05] p-1.5">
              <div className="flex items-center justify-between text-emerald-300">
                <span className="flex items-center gap-1 font-semibold">
                  <CheckCircle2 size={10} /> Math Verification
                </span>
                <span className="font-mono text-[0.58rem]">500 × €169 = €84.5k</span>
              </div>
            </div>

            {/* Reconciliation */}
            <div className="rounded border border-white/[0.05] bg-white/[0.02] p-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sand-300">Dossier Reconciliation</span>
                <span className="text-emerald-300 font-semibold">Matched (CI = PL)</span>
              </div>
            </div>

            {/* Duty Calculation */}
            <div className="rounded border border-gold-300/25 bg-gold-300/[0.06] p-1.5">
              <div className="flex items-center justify-between text-gold-200">
                <span className="flex items-center gap-1 font-semibold">
                  <Scale size={10} /> Duty Estimation
                </span>
                <span className="font-mono font-bold">2.7% (€2,281.50)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit ledger workflow ribbon */}
      <div aria-hidden="true" className="border-t border-white/[0.06] bg-ink-900/60 px-3 py-1.5">
        <div className="flex items-center justify-between font-mono text-[0.56rem]">
          <span className="flex items-center gap-1 text-sand-400">
            <span>OCR</span>
            <ArrowRight size={8} className="text-sand-500" />
            <span>Validation</span>
            <ArrowRight size={8} className="text-sand-500" />
            <span className="text-gold-300">AI Proposal</span>
            <ArrowRight size={8} className="text-sand-500" />
            <span className="rounded bg-white/10 px-1 text-sand-200">Human Review</span>
          </span>
          <span className="text-[0.54rem] text-sand-500">
            Audit Hash: <span className="text-sand-400">#9f2b8a...</span>
          </span>
        </div>
      </div>

      {/* Illustrative preview caption */}
      <div aria-hidden className="flex items-center justify-between border-t border-white/[0.04] px-3 py-1 bg-ink-950 text-[0.56rem] text-sand-500">
        <span>Sample invoice fixture · Deterministic math checks</span>
        <span>pgvector HNSW hybrid retrieval</span>
      </div>
    </div>
  );
});
