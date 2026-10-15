/**
 * Hosts the world behind all UI.
 *
 * 1. The static SVG world paints immediately (fast first paint, no WebGL).
 * 2. On capable devices the WebGL world chunk loads once the browser is idle
 *    (desktop) or after the first interaction / a short delay (touch), then
 *    cross-fades in. The canvas is mounted once and never remounted.
 * 3. On WebGL failure or context loss, the static world stays.
 */
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { hasWebGL } from '../hooks/webgl';
import { usePrefersReducedMotion } from '../hooks/useMediaQuery';
import { resetLabelSmoothing } from './labels';
import { StaticWorld } from './StaticWorld';
import { arrive, world } from './store';
import type { Quality } from './scene/kit';

const WorldScene = lazy(() => import('./scene/WorldScene'));

type NavigatorHints = Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };

function canRender3d() {
  const nav = navigator as NavigatorHints;
  if (nav.connection?.saveData) return false;
  if (typeof nav.deviceMemory === 'number' && nav.deviceMemory < 2) return false;
  return hasWebGL();
}

function detectQuality(reduced: boolean): Quality {
  const fine = window.matchMedia('(pointer: fine)').matches;
  const wide = window.innerWidth >= 1024;
  const high = fine && wide;
  return {
    tier: high ? 'high' : 'low',
    motion: reduced ? 0 : 1,
    clouds: high ? 150 : 64,
    embers: high ? 95 : 45,
    distant: high ? 44 : 20,
    city: high ? 1 : 0.6,
  };
}

/** Desktop: load when idle. Touch / small screens: first interaction or 2.5 s idle. */
function useLoadTrigger(enabled: boolean) {
  const [go, setGo] = useState(false);
  useEffect(() => {
    if (!enabled || go) return;
    const desktop = window.matchMedia('(pointer: fine) and (min-width: 1024px)').matches;
    const fire = () => setGo(true);
    const idle = (cb: () => void, timeout: number) =>
      'requestIdleCallback' in window
        ? (() => {
            const id = window.requestIdleCallback(cb, { timeout });
            return () => window.cancelIdleCallback(id);
          })()
        : (() => {
            const id = setTimeout(cb, timeout / 2);
            return () => clearTimeout(id);
          })();
    if (desktop) return idle(fire, 1500);
    const timer = setTimeout(() => idle(fire, 1500), 2500);
    const events = ['pointerdown', 'keydown', 'touchstart'] as const;
    events.forEach((e) => window.addEventListener(e, fire, { once: true, passive: true }));
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, fire));
    };
  }, [enabled, go]);
  return go;
}

export function WorldStage() {
  const reduced = usePrefersReducedMotion();
  const capable = useMemo(canRender3d, []);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [staticGone, setStaticGone] = useState(false);
  const load = useLoadTrigger(capable && !failed);
  // Quality is decided once, when the canvas first mounts.
  const quality = useMemo(() => (load ? detectQuality(reduced) : null), [load]); // eslint-disable-line react-hooks/exhaustive-deps

  // Without WebGL there is no stage to walk: open the world at Home.
  useEffect(() => {
    if (!capable || failed) arrive();
  }, [capable, failed]);

  const live = ready && !failed;
  useEffect(() => {
    resetLabelSmoothing();
    world.set({ mode: live ? '3d' : 'static' });
    if (!live) {
      setStaticGone(false);
      // Static world needs a layout pass once it owns the labels again.
      requestAnimationFrame(() => window.dispatchEvent(new Event('world:layout')));
      return;
    }
    const t = setTimeout(() => setStaticGone(true), 1600);
    return () => clearTimeout(t);
  }, [live]);

  const onReady = useCallback(() => setReady(true), []);
  const onLost = useCallback(() => setFailed(true), []);

  return (
    <div className="fixed inset-0 z-0 bg-ink-900">
      {!staticGone && <StaticWorld hidden={live} />}
      {quality && !failed && (
        <ErrorBoundary onError={onLost}>
          <Suspense fallback={null}>
            <div className={`absolute inset-0 transition-opacity duration-[1400ms] ease-out ${live ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
              <WorldScene quality={quality} onReady={onReady} onLost={onLost} />
            </div>
          </Suspense>
        </ErrorBoundary>
      )}
    </div>
  );
}
