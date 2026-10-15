import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Compass, Footprints, Pause, Play, RotateCcw, SkipForward, X } from 'lucide-react';
import { S_STAIRS_TOP, runtime } from '../journey';
import { usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { useExclusion } from '../../hooks/useExclusion';
import { getLandmark, journey, landmarks } from '../landmarks';
import { arrive, beginJourney, registry, select, setManual, stopTour, tourGo, useWorld, world } from '../store';
import { LandmarkIcon } from './LandmarkIcon';

const TOUR_STEP_MS = 6500;

function isTyping(el: Element | null) {
  return !!el && (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || (el as HTMLElement).isContentEditable);
}

/** Global keyboard shortcuts: Esc closes, 1–6 select landmarks, ←/→ step through sections. */
function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return;
      if (document.querySelector('dialog[open]')) return; // native dialogs handle their own Esc
      const s = world.get();
      if (e.key === 'Escape') {
        if (s.intro !== 'arrived') arrive();
        else if (s.tour !== null) stopTour();
        else if (s.active === 'projects' && s.project) select('projects', { project: null });
        else if (s.active !== 'home') select('home');
        else if (s.panned) registry.resetPan?.();
        else return;
        e.preventDefault();
        return;
      }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= landmarks.length) {
        select(landmarks[n - 1].id);
        e.preventDefault();
        return;
      }
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && s.active !== 'home') {
        // Only when focus is not inside a scrollable panel control that uses arrows.
        if ((document.activeElement as HTMLElement | null)?.closest('[role="tablist"],input,select')) return;
        if (s.tour !== null) {
          tourGo(s.tour + (e.key === 'ArrowRight' ? 1 : -1));
        } else {
          const i = journey.indexOf(s.active);
          const next = journey[i + (e.key === 'ArrowRight' ? 1 : -1)];
          if (next) select(next);
        }
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

const FORWARD = new Set(['w', 'W', 'ArrowUp']);
const BACK = new Set(['s', 'S', 'ArrowDown']);

/**
 * Optional keyboard exploration on the arrival path: hold W / ↑ to walk
 * toward Home, S / ↓ to step back. Starting to walk from the stage switches
 * the journey into manual mode.
 */
function useWalkKeys() {
  useEffect(() => {
    const held = new Set<string>();
    const update = () => {
      const f = [...held].some((k) => FORWARD.has(k));
      const b = [...held].some((k) => BACK.has(k));
      runtime.manualDir = f === b ? 0 : f ? 1 : -1;
    };
    const eligible = (e: KeyboardEvent) => {
      const s = world.get();
      if (s.intro === 'arrived' || s.mode !== '3d' || s.active !== 'home') return false;
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(document.activeElement)) return false;
      return FORWARD.has(e.key) || BACK.has(e.key);
    };
    const down = (e: KeyboardEvent) => {
      if (!eligible(e)) return;
      e.preventDefault();
      const s = world.get();
      if (s.intro === 'stage' && FORWARD.has(e.key)) beginJourney({ manual: true });
      else if (s.intro === 'walking' && !s.manual) setManual(true);
      held.add(e.key);
      update();
    };
    const up = (e: KeyboardEvent) => {
      if (!held.delete(e.key)) return;
      update();
    };
    const clear = () => {
      held.clear();
      update();
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    window.addEventListener('blur', clear);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', clear);
    };
  }, []);
}

/** Shown while walking: progress, controls hint, and an always-available skip. */
function JourneyHUD() {
  const walking = useWorld((s) => s.intro === 'walking');
  const manual = useWorld((s) => s.manual);
  const bar = useRef<HTMLSpanElement>(null);
  const skip = useRef<HTMLButtonElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  useExclusion('journey-hud', ref, walking);

  useEffect(() => {
    if (!walking) return;
    skip.current?.focus({ preventScroll: true });
    let id = 0;
    const tick = () => {
      if (bar.current) bar.current.style.transform = `scaleX(${Math.min(1, runtime.s / (S_STAIRS_TOP + 0.4)).toFixed(3)})`;
      id = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(id);
  }, [walking]);

  if (!walking) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-start px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-8 sm:pb-8 lg:px-12">
      {/* Bottom-left so the traveller (screen centre) stays in view */}
      <div ref={ref} data-journey-hud role="region" aria-label="Journey to Home" className="panel pointer-events-auto w-full max-w-[19rem] !rounded-xl !bg-ink-900/78 px-4 py-3.5">
        <div className="flex items-center justify-between gap-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-sand-100">
            <Footprints size={15} className="text-gold-300" aria-hidden /> Ascending to Home
          </p>
          <button ref={skip} type="button" className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => arrive()}>
            <SkipForward size={13} aria-hidden /> Skip <span className="text-sand-400">(Esc)</span>
          </button>
        </div>
        <span aria-hidden className="mt-3 block h-0.5 overflow-hidden rounded bg-white/10">
          <span ref={bar} className="block h-full origin-left bg-gold-300" style={{ transform: 'scaleX(0)' }} />
        </span>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-sand-300">
          <span>{manual ? 'Hold W / ↑ to walk · S / ↓ to step back' : 'Hold W / ↑ to walk yourself'}</span>
          {manual && (
            <button type="button" className="link-underline text-gold-200" onClick={() => setManual(false)}>
              Walk automatically
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Announces arrivals for screen-reader users. */
function Announcer() {
  const active = useWorld((s) => s.active);
  const tour = useWorld((s) => s.tour);
  const first = useRef(true);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const l = getLandmark(active);
    setMsg(active === 'home' ? 'At Home, the world overview.' : `${tour !== null ? 'Tour: ' : ''}${l.title}, ${l.place}.`);
  }, [active, tour]);
  const intro = useWorld((s) => s.intro);
  const prevIntro = useRef(intro);
  useEffect(() => {
    if (prevIntro.current === intro) return;
    if (intro === 'walking') setMsg('Journey started: walking up the staircase to Home. Press Escape to skip.');
    else if (intro === 'arrived' && prevIntro.current === 'walking') setMsg('Arrived at Home. All six landmarks are now open to explore.');
    prevIntro.current = intro;
  }, [intro]);
  return (
    <p className="sr-only" role="status" aria-live="polite">
      {msg}
    </p>
  );
}

function TourCaption() {
  const tour = useWorld((s) => s.tour);
  const reduced = usePrefersReducedMotion();
  const [playing, setPlaying] = useState(!reduced);
  const ref = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLButtonElement>(null);
  useExclusion('tour', ref, tour !== null);

  useEffect(() => {
    if (tour === null) return;
    setPlaying(!reduced);
    exitRef.current?.focus({ preventScroll: true });
  }, [tour === null]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tour === null || !playing) return;
    const id = setTimeout(() => tourGo(tour + 1), TOUR_STEP_MS);
    return () => clearTimeout(id);
  }, [tour, playing]);

  if (tour === null) return null;
  const l = getLandmark(journey[tour]);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-8">
      <div
        ref={ref}
        role="region"
        aria-label="Guided tour"
        className="panel pointer-events-auto w-full max-w-xl !bg-ink-900/82 p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-lg border border-gold-300/35 bg-gold-300/[0.08] text-gold-300">
              <LandmarkIcon icon={l.icon} size={18} />
            </span>
            <div>
              <p className="text-xs text-gold-300 tabular-nums">
                Stop {tour + 1} of {journey.length} · {l.index}
              </p>
              <p className="text-lg font-semibold text-sand-100">
                {l.title} <span className="font-normal text-sand-400">— {l.place}</span>
              </p>
            </div>
          </div>
          <button ref={exitRef} type="button" onClick={stopTour} className="-mr-2 rounded-lg p-2 text-sand-300 hover:bg-white/5 hover:text-sand-100" aria-label="End tour">
            <X size={18} aria-hidden />
          </button>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-sand-300">{l.tour}</p>
        <div aria-hidden className="mt-4 flex gap-1.5">
          {journey.map((id, i) => (
            <span key={id} className="h-0.5 flex-1 overflow-hidden rounded bg-white/10">
              <span
                key={`${tour}-${playing}`}
                className="block h-full origin-left bg-gold-300"
                style={{
                  transform: i < tour || (i === tour && !playing) ? 'scaleX(1)' : 'scaleX(0)',
                  animation: i === tour && playing ? `reel-progress ${TOUR_STEP_MS}ms linear forwards` : undefined,
                }}
              />
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button type="button" className="btn btn-quiet !p-2" onClick={() => tourGo(tour - 1)} disabled={tour === 0} aria-label="Previous stop">
              <ChevronLeft size={18} aria-hidden />
            </button>
            <button type="button" className="btn btn-ghost !px-3 !py-2" onClick={() => setPlaying((p) => !p)} aria-pressed={playing}>
              {playing ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
              {playing ? 'Pause' : 'Play'}
            </button>
            <button type="button" className="btn btn-quiet !p-2" onClick={() => tourGo(tour + 1)} aria-label={tour === journey.length - 1 ? 'Finish tour' : 'Next stop'}>
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
          <button type="button" className="btn btn-primary !py-2.5" onClick={() => select(l.id)}>
            Open {l.title}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Reset-view control and keyboard hints shown over the overview. */
function ViewControls() {
  const panned = useWorld((s) => s.panned);
  const overview = useWorld((s) => s.active === 'home' && s.tour === null);
  const mode = useWorld((s) => s.mode);
  const ref = useRef<HTMLDivElement>(null);
  const visible = panned && mode === '3d';
  useExclusion('view-controls', ref, visible);
  return (
    <div
      ref={ref}
      className={`fixed top-[calc(var(--nav-h)+0.75rem)] left-1/2 z-30 -translate-x-1/2 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}
      inert={!visible}
    >
      <button type="button" onClick={() => registry.resetPan?.()} className="btn btn-ghost !bg-ink-900/75 !py-2 backdrop-blur">
        {overview ? <RotateCcw size={15} aria-hidden /> : <Compass size={15} aria-hidden />}
        Reset view
      </button>
    </div>
  );
}

export function WorldControls() {
  useShortcuts();
  useWalkKeys();
  return (
    <>
      <JourneyHUD />
      <ViewControls />
      <TourCaption />
      <Announcer />
    </>
  );
}
