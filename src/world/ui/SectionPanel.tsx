import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import { useExclusion } from '../../hooks/useExclusion';
import { getLandmark, journey, type LandmarkId } from '../landmarks';
import { isPanelOpen, registry, select, useWorld, world } from '../store';
import { LandmarkIcon } from './LandmarkIcon';
import { WorldLink } from './WorldLink';

// Section bodies are split out so the initial bundle stays small.
const bodies: Record<Exclude<LandmarkId, 'home'>, ComponentType> = {
  about: lazy(() => import('../../panels/AboutPanel')),
  projects: lazy(() => import('../../panels/ProjectsPanel')),
  experience: lazy(() => import('../../panels/ExperiencePanel')),
  achievements: lazy(() => import('../../panels/AchievementsPanel')),
  contact: lazy(() => import('../../panels/ContactPanel')),
};

/** Warm the panel chunks once the page is idle so opening feels instant. */
export function preloadPanels() {
  import('../../panels/AboutPanel');
  import('../../panels/ProjectsPanel');
  import('../../panels/ExperiencePanel');
  import('../../panels/AchievementsPanel');
  import('../../panels/ContactPanel');
}

const eyebrows: Record<Exclude<LandmarkId, 'home'>, string> = {
  about: 'The engineer behind the code',
  projects: 'Engineered systems & real workflows',
  experience: 'Open source contributions',
  achievements: 'Milestones on the journey',
  contact: 'Build something amazing together',
};

function PanelSkeleton() {
  return (
    <div aria-hidden className="space-y-3">
      {[70, 90, 55].map((w) => (
        <div key={w} className="h-4 animate-pulse-soft rounded bg-white/[0.05]" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

/**
 * The content panel. One persistent element: it slides in beside the world
 * on desktop and up as a sheet on smaller screens. The WebGL world keeps
 * rendering behind it; the camera frames the landmark in the free space.
 */
export function SectionPanel() {
  const active = useWorld((s) => s.active);
  const project = useWorld((s) => s.project);
  const open = useWorld(isPanelOpen);
  const wide = useMediaQuery('(min-width: 1024px)');
  const [shown, setShown] = useState<Exclude<LandmarkId, 'home'> | null>(open && active !== 'home' ? active : null);
  const ref = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const body = useRef<HTMLDivElement>(null);
  useExclusion('panel', ref, open);

  // Keep the last section rendered while the panel slides out.
  useEffect(() => {
    if (open && active !== 'home') {
      setShown(active);
      return;
    }
    const t = setTimeout(() => setShown(null), 500);
    return () => clearTimeout(t);
  }, [open, active]);

  // Tell the camera how much of the screen the panel covers.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      if (!isPanelOpen(world.get())) {
        registry.panelBox = null;
      } else {
        registry.panelBox = wide
          ? { side: 'right', size: window.innerWidth - el.offsetLeft }
          : { side: 'bottom', size: window.innerHeight - el.offsetTop };
      }
      window.dispatchEvent(new Event('world:layout'));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [open, wide]);

  // Focus: heading on open / section change; back to the trigger on close.
  const wasOpen = useRef(open);
  useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(() => heading.current?.focus({ preventScroll: true }));
      wasOpen.current = true;
      return () => cancelAnimationFrame(id);
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      const t = setTimeout(() => {
        const trigger = registry.trigger;
        const usable = trigger && document.contains(trigger) && getComputedStyle(trigger).visibility !== 'hidden' && !trigger.closest('[inert]');
        (usable ? trigger : document.querySelector<HTMLElement>('[data-brand]'))?.focus({ preventScroll: true });
      }, 80);
      return () => clearTimeout(t);
    }
  }, [open, active]);

  // Scroll memory: a new section or project starts at the top; going back
  // from a project detail to the list restores where the visitor was.
  const scrollMemo = useRef(new Map<string, number>());
  const viewKey = shown ? `${shown}|${shown === 'projects' ? (project ?? '') : ''}` : '';
  const lastKey = useRef('');
  useLayoutEffect(() => {
    const el = body.current;
    if (!el || !viewKey) return;
    const prevKey = lastKey.current;
    const backToList = viewKey === 'projects|' && prevKey.startsWith('projects|') && prevKey !== 'projects|';
    if (prevKey.split('|')[0] !== viewKey.split('|')[0]) scrollMemo.current.clear();
    el.scrollTop = backToList ? (scrollMemo.current.get(viewKey) ?? 0) : 0;
    lastKey.current = viewKey;
  }, [viewKey]);
  const onScroll = () => {
    const el = body.current;
    if (el && viewKey) scrollMemo.current.set(viewKey, el.scrollTop);
    setScrolled(!!el && el.scrollTop > 4);
    setAtEnd(!!el && el.scrollTop + el.clientHeight >= el.scrollHeight - 8);
  };
  const [scrolled, setScrolled] = useState(false);
  const [atEnd, setAtEnd] = useState(false);
  useEffect(() => {
    const el = body.current;
    if (!el) return;
    const check = () => setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 8);
    const ro = new ResizeObserver(check);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    check();
    return () => ro.disconnect();
  }, [viewKey]);

  const id = shown;
  const l = id ? getLandmark(id) : null;
  const Body = id ? bodies[id] : null;
  const i = id ? journey.indexOf(id) : -1;
  const prev = i > 0 ? journey[i - 1] : null;
  const next = i >= 0 && i < journey.length - 1 ? journey[i + 1] : null;

  return (
    <section
      ref={ref}
      data-panel
      aria-labelledby="panel-title"
      inert={!open}
      className={`panel fixed z-30 flex flex-col overflow-hidden !bg-ink-900/88 transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.2,0.7,0.2,1)] ${
        wide
          ? 'top-[calc(var(--nav-h)+0.75rem)] right-4 bottom-4 w-[clamp(26rem,42vw,40rem)]'
          : 'inset-x-0 bottom-0 mx-auto h-[min(80dvh,48rem)] max-w-3xl !rounded-b-none'
      } ${open ? 'translate-x-0 translate-y-0 opacity-100' : wide ? 'translate-x-[calc(100%+2rem)] opacity-0' : 'translate-y-full opacity-0'}`}
    >
      {!wide && <div aria-hidden className="mx-auto mt-2 mb-1 h-1 w-10 shrink-0 rounded-full bg-white/20" />}
      {l && (
        <header
          className={`relative z-10 flex shrink-0 items-start justify-between gap-4 border-b px-5 pt-4 pb-4 transition-[border-color,box-shadow] sm:px-7 sm:pt-6 ${
            scrolled ? 'border-white/[0.1] shadow-[0_10px_24px_-14px_rgb(0_0_0/0.9)]' : 'border-white/[0.06]'
          }`}
        >
          <div className="flex min-w-0 items-center gap-3.5">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-gold-300/35 bg-gold-300/[0.08] text-gold-300">
              <LandmarkIcon icon={l.icon} size={20} />
            </span>
            <div className="min-w-0">
              <p className="eyebrow truncate !tracking-[0.2em]">
                <span className="text-gold-300">{l.index}</span> · {l.place}
              </p>
              <h2 id="panel-title" ref={heading} tabIndex={-1} className="mt-1 text-2xl font-semibold outline-none sm:text-[1.7rem]">
                {l.title}
              </h2>
              <p className="mt-0.5 truncate text-xs text-sand-400">{id && eyebrows[id]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => select('home')}
            className="-mr-2 grid size-11 shrink-0 place-items-center rounded-lg text-sand-300 transition hover:bg-white/5 hover:text-sand-100"
            aria-label={`Close ${l.title} and return to the world (Esc)`}
          >
            <X size={20} aria-hidden />
          </button>
        </header>
      )}

      <div className="relative min-h-0 flex-1">
      <div
        ref={body}
        onScroll={onScroll}
        tabIndex={-1}
        className="panel-scroll absolute inset-0 overflow-y-auto overscroll-contain scroll-pt-6 px-5 pt-6 pb-10 outline-none sm:px-7"
      >
        {Body && (
          <div key={viewKey} className="panel-enter">
            <Suspense fallback={<PanelSkeleton />}>
              <Body />
            </Suspense>
          </div>
        )}
      </div>
      {/* Fade hinting that there is more content below */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-ink-900 to-transparent transition-opacity duration-300 ${atEnd ? 'opacity-0' : 'opacity-100'}`}
      />
      </div>

      {l && (
        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.06] px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-sm sm:px-7">
          {prev ? (
            <WorldLink to={prev} className="btn btn-quiet !px-2 !py-2">
              <ArrowLeft size={16} aria-hidden /> {getLandmark(prev).title}
            </WorldLink>
          ) : (
            <WorldLink to="home" className="btn btn-quiet !px-2 !py-2">
              <ArrowLeft size={16} aria-hidden /> World
            </WorldLink>
          )}
          {next ? (
            <WorldLink to={next} className="btn btn-quiet !px-2 !py-2">
              {getLandmark(next).title} <ArrowRight size={16} aria-hidden />
            </WorldLink>
          ) : (
            <WorldLink to="home" className="btn btn-quiet !px-2 !py-2">
              Back to world <ArrowRight size={16} aria-hidden />
            </WorldLink>
          )}
        </footer>
      )}
    </section>
  );
}
