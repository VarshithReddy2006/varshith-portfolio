import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Footprints, SkipForward, CodeXml, GitPullRequest, Layers, MapPin, Play, Route, Trophy, type LucideIcon } from 'lucide-react';
import { heroStats, profile } from '../../data/content';
import { Dialog } from '../../components/ui/Dialog';
import { useExclusion } from '../../hooks/useExclusion';
import { useMediaQuery, usePrefersReducedMotion } from '../../hooks/useMediaQuery';
import { journey, landmarks } from '../landmarks';
import { arrive, beginJourney, hashFor, select, startTour, useWorld } from '../store';
import { LandmarkIcon } from './LandmarkIcon';

const statIcons: Record<(typeof heroStats)[number]['icon'], LucideIcon> = {
  code: CodeXml,
  trophy: Trophy,
  pr: GitPullRequest,
  layers: Layers,
};

/**
 * The hero introduction floating over the world (bottom-left), the stats
 * panel (bottom-right), and on phones a one-tap strip of all six landmarks.
 * Fades away while a section panel or the tour is open.
 */
export function HeroOverlay() {
  const show = useWorld((s) => s.active === 'home' && s.tour === null && s.intro !== 'walking');
  const mode = useWorld((s) => s.mode);
  const intro = useWorld((s) => s.intro);
  const reduced = usePrefersReducedMotion();
  const onStage = intro === 'stage';
  const explore = useRef<HTMLAnchorElement>(null);
  // After the journey, hand keyboard focus to the next step.
  const wasWalking = useRef(false);
  useEffect(() => {
    if (intro === 'walking') wasWalking.current = true;
    else if (intro === 'arrived' && wasWalking.current) {
      wasWalking.current = false;
      const a = document.activeElement;
      if (!a || a === document.body || a.closest('[data-journey-hud]')) {
        const id = setTimeout(() => explore.current?.focus({ preventScroll: true }), 600);
        return () => clearTimeout(id);
      }
    }
  }, [intro]);
  const fine = useMediaQuery('(pointer: fine)');
  const [videoOpen, setVideoOpen] = useState(false);
  const introBox = useRef<HTMLDivElement>(null);
  const stats = useRef<HTMLUListElement>(null);
  useExclusion('hero-intro', introBox, show);
  useExclusion('hero-stats', stats, show);

  const hint = onStage
    ? mode === '3d' && fine
      ? 'Begin the journey · or hold W / ↑ to walk'
      : 'Begin the journey to enter the world'
    : mode === '3d'
      ? fine
        ? 'Select a landmark · drag to look around'
        : 'Tap a landmark · drag to look around'
      : fine
        ? 'Select a landmark to explore'
        : 'Tap a landmark to explore';

  return (
    <section
      aria-labelledby="hero-title"
      inert={!show}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-10 transition-[opacity,transform] duration-500 ${
        show ? 'opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      {/* Legibility scrim behind the intro (does not block the world) */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[44vh] sm:h-[56vh] bg-[radial-gradient(95%_78%_at_0%_100%,rgb(7_7_6/0.92)_0%,rgb(7_7_6/0.6)_42%,transparent_72%)] md:h-[62vh] md:bg-[radial-gradient(50%_85%_at_0%_100%,rgb(7_7_6/0.92)_0%,rgb(7_7_6/0.76)_40%,rgb(7_7_6/0.35)_64%,transparent_82%)]"
      />
      <div className="container-x relative flex items-end justify-between gap-8 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-8 lg:pb-10">
        <div ref={introBox} className="pointer-events-auto w-full max-w-[31rem]">
          <p className="text-sm text-sand-200 sm:text-xl">Hello, I'm</p>
          <h1 id="hero-title" className="mt-1 text-[clamp(1.55rem,5.2vw,3.75rem)] leading-[1.03] font-bold [text-shadow:0_2px_24px_rgb(0_0_0/0.55)] sm:mt-3">
            <span className="block">{profile.firstName}</span>
            <span className="block">
              <span className="text-gold-gradient">Varshith</span> Reddy
            </span>
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.74rem] font-semibold text-sand-100 sm:mt-4 sm:gap-x-3 sm:text-[0.95rem]">
            {profile.roles.map((r, i) => (
              <span key={r} className="flex items-center gap-2 sm:gap-3">
                {i > 0 && <span aria-hidden className="h-4 w-px bg-sand-500" />}
                {r}
              </span>
            ))}
          </p>
          <p className={`mt-2 max-w-md text-xs leading-relaxed text-sand-200 sm:mt-4 sm:text-base ${onStage ? 'hidden sm:block' : ''}`}>{profile.tagline}</p>

          <div className="mt-5 flex flex-wrap items-center gap-3 sm:mt-7">
            {onStage ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => beginJourney({ instant: reduced })}
                  aria-describedby="journey-desc"
                >
                  <Footprints size={16} aria-hidden /> Begin Journey
                </button>
                <button type="button" className="btn btn-quiet group" onClick={() => arrive()}>
                  <span className="grid size-10 place-items-center rounded-full border border-sand-300/50 transition group-hover:border-gold-300">
                    <SkipForward size={15} aria-hidden />
                  </span>
                  Skip to the world
                </button>
                <span id="journey-desc" className="sr-only">
                  {reduced
                    ? 'Opens the world at Home without the animated walk.'
                    : 'Walks from the central stage up the staircase to the Home gateway. Press Escape to skip.'}
                </span>
              </>
            ) : (
              <>
            <a
              ref={explore}
              href={hashFor(journey[0])}
              onClick={(e) => {
                e.preventDefault();
                select(journey[0]);
              }}
              className="btn btn-primary"
            >
              Explore My World <ArrowRight size={16} aria-hidden />
            </a>
            {profile.introVideoUrl ? (
              <button type="button" className="btn btn-quiet group" onClick={() => setVideoOpen(true)} aria-haspopup="dialog">
                <span className="grid size-10 place-items-center rounded-full border border-sand-300/50 transition group-hover:border-gold-300">
                  <Play size={14} className="translate-x-px" aria-hidden />
                </span>
                Watch Intro
              </button>
            ) : (
              <button type="button" className="btn btn-quiet group" onClick={startTour}>
                <span className="grid size-10 place-items-center rounded-full border border-sand-300/50 transition group-hover:border-gold-300">
                  <Route size={15} aria-hidden />
                </span>
                Take the Tour
              </button>
            )}
              </>
            )}
          </div>

          {/* Phones: every landmark one tap away, only when arrived in the world */}
          {!onStage && (
            <ul aria-label="Jump to a landmark" className="-mx-1 mt-4 flex gap-2 overflow-x-auto no-scrollbar px-1 pb-1 md:hidden">
              {landmarks
                .filter((l) => l.id !== 'home')
                .map((l) => (
                  <li key={l.id} className="shrink-0">
                    <a
                      href={hashFor(l.id)}
                      onClick={(e) => {
                        e.preventDefault();
                        select(l.id);
                      }}
                      className="flex min-h-11 items-center gap-2 rounded-full border border-gold-300/30 bg-ink-900/70 px-3.5 text-xs font-medium text-sand-100 backdrop-blur"
                    >
                      <LandmarkIcon icon={l.icon} size={14} className="text-gold-300" />
                      {l.title}
                    </a>
                  </li>
                ))}
            </ul>
          )}

          <p className="mt-6 hidden items-center gap-3 text-[0.68rem] font-semibold tracking-[0.22em] text-sand-400 uppercase md:flex">
            <span className="grid size-8 place-items-center rounded-full border border-white/15">
              <MapPin size={14} aria-hidden />
            </span>
            {hint}
          </p>
        </div>

        <ul
          ref={stats}
          aria-label="Highlights"
          className={`panel pointer-events-auto shrink-0 items-stretch divide-x divide-white/[0.07] !rounded-xl !bg-ink-900/72 transition-opacity duration-500 ${
            !onStage ? 'hidden lg:flex' : 'hidden'
          }`}
        >
          {heroStats.map((s) => {
            const Icon = statIcons[s.icon];
            return (
              <li key={s.label} className={`flex items-center gap-2.5 px-3.5 py-2.5`}>
                <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-gold-300/25 bg-gold-300/[0.07] text-gold-300">
                  <Icon size={15} aria-hidden />
                </span>
                <span>
                  <span className="block text-base leading-tight font-semibold text-sand-100">{s.value}</span>
                  <span className="block max-w-[8.5rem] text-[0.66rem] leading-snug text-sand-300">{s.label}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {profile.introVideoUrl && (
        <Dialog open={videoOpen} onClose={() => setVideoOpen(false)} title="Intro" subtitle={profile.name}>
          <video src={profile.introVideoUrl} controls className="aspect-video w-full rounded-xl bg-black">
            <track kind="captions" />
          </video>
        </Dialog>
      )}
    </section>
  );
}
