import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarRange, CircleCheck, Layers, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { evidenceLabels, projects, type Evidence, type Project } from '../data/content';
import { AriaGraphFallback } from '../components/fallbacks/AriaGraphFallback';
import { useWorld } from '../world/store';
import { WorldLink } from '../world/ui/WorldLink';
import { DevTrackMock } from './projects/DevTrackMock';
import { StratifyMock } from './projects/StratifyMock';
import { PhishGuardMock } from './projects/PhishGuardMock';

const evidenceTone: Record<Evidence, string> = {
  verified: 'bg-emerald-400',
  reported: 'bg-gold-300',
  target: 'bg-sky-300',
  architecture: 'bg-sand-400',
};

function EvidenceDot({ type }: { type: Evidence }) {
  return (
    <span className="inline-flex items-center gap-1 text-[0.62rem] text-sand-400" title={evidenceLabels[type]}>
      <span aria-hidden className={`size-1.5 rounded-full ${evidenceTone[type]}`} />
      <span className="sr-only">{evidenceLabels[type]}</span>
    </span>
  );
}

function AriaPreview() {
  return (
    <div
      className="relative h-60 overflow-hidden rounded-xl border border-white/[0.07] sm:h-72"
      style={{
        background:
          'radial-gradient(60% 60% at 50% 50%, rgb(185 164 255 / 0.08), transparent 70%), radial-gradient(80% 70% at 50% 60%, rgb(232 197 138 / 0.08), transparent 70%), #0d0c0b',
      }}
    >
      <div aria-hidden className="grid-texture absolute inset-0 opacity-70" />
      <div
        role="img"
        aria-label="ARIA architecture: Git repository to Tree-sitter AST, symbol index and API surface, dependency and call graphs in NetworkX, Qdrant and ChromaDB feeding hybrid retrieval, then impact analysis, PR risk scoring and repository chat, served through FastAPI, MCP and SSE with LLM failover and observability."
        className="absolute inset-0"
      >
        <AriaGraphFallback />
      </div>
      <p className="absolute bottom-2.5 left-3 rounded-md border border-white/10 bg-ink-900/80 px-2.5 py-1 text-[0.68rem] text-sand-300 backdrop-blur">
        AST → graphs → retrieval → intelligence → serving
      </p>
    </div>
  );
}

const visuals: Record<Project['id'], () => ReactNode> = {
  aria: () => <AriaPreview />,
  devtrack: () => <DevTrackMock />,
  stratify: () => <StratifyMock />,
  phishing: () => <PhishGuardMock />,
};

function TechList({ tech, className = '' }: { tech: string[]; className?: string }) {
  return (
    <ul aria-label="Technologies" className={`flex flex-wrap gap-1.5 ${className}`}>
      {tech.map((t) => (
        <li key={t} className="chip">
          {t}
        </li>
      ))}
    </ul>
  );
}

function RepoAction({ project, primary = false }: { project: Project; primary?: boolean }) {
  if (!project.repo.public) {
    return (
      <span className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm text-sand-400">
        <Lock size={15} aria-hidden /> Repository not public yet
      </span>
    );
  }
  return (
    <a href={project.repo.href} target="_blank" rel="noopener noreferrer" className={`btn ${primary ? 'btn-primary' : 'btn-quiet'} !py-2.5`}>
      Repository <ArrowUpRight size={16} aria-hidden />
      <span className="sr-only"> for {project.name} on GitHub (opens in a new tab)</span>
    </a>
  );
}

function Metrics({ project }: { project: Project }) {
  return (
    <dl className="grid grid-cols-3 gap-2">
      {project.metrics.map((m) => (
        <div key={m.label} className="flex flex-col-reverse rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
          <dt className="flex items-center gap-1.5 text-[0.66rem] leading-tight text-sand-400">
            <EvidenceDot type={m.evidence} />
            <span className="truncate">{m.label}</span>
          </dt>
          <dd className="text-base font-bold text-sand-100 sm:text-lg">{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Project whose detail view was open last; the list re-focuses its card. */
let lastDetail: Project['id'] | null = null;

function ProjectList() {
  useEffect(() => {
    if (!lastDetail) return;
    document.querySelector<HTMLElement>(`[data-detail="${lastDetail}"]`)?.focus({ preventScroll: true });
    lastDetail = null;
  }, []);
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-sand-300">
        Four systems, four towers in the Engineering District. Select one here or click its tower in the world.
      </p>
      <ul className="space-y-4">
        {projects.map((p) => (
          <li key={p.id}>
            <article aria-labelledby={`card-${p.id}`} className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition hover:border-gold-300/30">
              <div className="flex flex-wrap items-center gap-2 text-xs text-sand-400">
                <span className="flex items-center gap-1.5">
                  <CalendarRange size={13} aria-hidden /> {p.dates}
                </span>
                {p.id === 'aria' && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-gold-300/35 bg-gold-300/[0.08] px-2 py-0.5 text-[0.65rem] font-semibold text-gold-200">
                    <Sparkles size={11} aria-hidden /> Featured
                  </span>
                )}
              </div>
              <h3 id={`card-${p.id}`} className="mt-2 text-xl font-bold">
                <span className={p.id === 'aria' ? 'text-gold-gradient' : ''}>{p.name}</span>
              </h3>
              <p className="text-sm font-medium text-gold-200/90">{p.subtitle}</p>
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-sand-300">{p.summary}</p>
              <div className="mt-4">
                <Metrics project={p} />
              </div>
              <TechList tech={p.tech.slice(0, 6)} className="mt-4" />
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <WorldLink to="projects" project={p.id} data-detail={p.id} className="btn btn-ghost !py-2.5">
                  View details <ArrowRight size={16} aria-hidden />
                  <span className="sr-only">: {p.name}</span>
                </WorldLink>
                <RepoAction project={p} />
              </div>
            </article>
          </li>
        ))}
      </ul>
      <EvidenceLegend />
    </div>
  );
}

function EvidenceLegend() {
  return (
    <ul aria-label="Evidence legend" className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-white/[0.06] pt-4 text-[0.7rem] text-sand-400">
      {(Object.keys(evidenceLabels) as Evidence[]).map((k) => (
        <li key={k} className="flex items-center gap-1.5">
          <span aria-hidden className={`size-1.5 rounded-full ${evidenceTone[k]}`} />
          {evidenceLabels[k]}
        </li>
      ))}
    </ul>
  );
}

function ProjectDetail({ project }: { project: Project }) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    lastDetail = project.id;
  }, [project.id]);
  const i = projects.findIndex((p) => p.id === project.id);
  const prev = projects[(i - 1 + projects.length) % projects.length];
  const next = projects[(i + 1) % projects.length];

  return (
    <article aria-labelledby="project-title" className="space-y-6">
      <WorldLink
        to="projects"
        project={null}
        className="sticky top-0 z-10 -mx-1 -mt-2 inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-ink-900/90 px-3.5 py-1.5 text-sm font-medium text-gold-100 backdrop-blur transition hover:border-gold-300/70"
      >
        <ArrowLeft size={15} aria-hidden /> All projects <span className="text-xs font-normal text-sand-400">(Esc)</span>
      </WorldLink>

      <header>
        <p className="text-xs font-medium text-gold-300/90">{project.categoryBadge}</p>
        <h3 id="project-title" ref={heading} tabIndex={-1} className="mt-1.5 text-3xl font-bold outline-none">
          <span className={project.id === 'aria' ? 'text-gold-gradient' : ''}>{project.name}</span>
        </h3>
        <p className="mt-1 font-medium text-sand-100">{project.subtitle}</p>
        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-sand-400">
          <CalendarRange size={13} aria-hidden /> {project.dates}
        </p>
      </header>

      {visuals[project.id]()}

      <div>
        <p className="leading-relaxed text-sand-100">{project.leadDescription}</p>
        <p className="mt-3 text-sm leading-relaxed text-sand-300">{project.summary}</p>
      </div>

      <div>
        <h4 className="text-xs font-semibold tracking-wider text-sand-400 uppercase">Capabilities</h4>
        <ul className="mt-3 grid gap-2 text-sm text-sand-200 sm:grid-cols-2">
          {project.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2">
              <CircleCheck size={15} className="mt-0.5 shrink-0 text-gold-300" aria-hidden /> {h}
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h4 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-sand-400 uppercase">
          <Layers size={14} aria-hidden /> How it works
        </h4>
        <ul className="mt-3 space-y-3">
          {project.details.map((d) => {
            const [title, ...rest] = d.split(': ');
            return (
              <li key={d} className="text-sm leading-relaxed text-sand-300">
                {rest.length ? (
                  <>
                    <span className="font-semibold text-sand-100">{title}.</span> {rest.join(': ')}
                  </>
                ) : (
                  d
                )}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-gold-300/20 bg-gold-300/[0.04] p-4">
        <h4 className="flex items-center gap-2 text-xs font-semibold tracking-wider text-gold-200 uppercase">
          <ShieldCheck size={15} className="text-gold-300" aria-hidden /> Figures and their evidence
        </h4>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {project.proofPoints.map((p) => (
            <div key={p.label} className="rounded-lg border border-white/[0.06] bg-ink-900/60 p-3">
              <dt className="text-[0.7rem] text-sand-400">{p.label}</dt>
              <dd>
                <span className="block text-base font-bold text-sand-100">{p.value}</span>
                <span className="mt-1 flex items-center gap-1.5 text-[0.66rem] font-medium text-sand-300">
                  <span aria-hidden className={`size-1.5 rounded-full ${evidenceTone[p.type]}`} />
                  {evidenceLabels[p.type]}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <div>
        <h4 className="text-xs font-semibold tracking-wider text-sand-400 uppercase">Technology stack</h4>
        <TechList tech={project.tech} className="mt-3" />
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-white/[0.06] pt-5">
        <RepoAction project={project} primary />
      </div>

      <nav aria-label="Other projects" className="flex justify-between gap-3 text-sm">
        <WorldLink to="projects" project={prev.id} className="btn btn-quiet !px-2">
          <ArrowLeft size={15} aria-hidden /> {prev.name}
        </WorldLink>
        <WorldLink to="projects" project={next.id} className="btn btn-quiet !px-2">
          {next.name} <ArrowRight size={15} aria-hidden />
        </WorldLink>
      </nav>
    </article>
  );
}

export default function ProjectsPanel() {
  const id = useWorld((s) => s.project);
  const project = projects.find((p) => p.id === id);
  return project ? <ProjectDetail key={project.id} project={project} /> : <ProjectList />;
}
