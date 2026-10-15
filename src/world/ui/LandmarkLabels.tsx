import { useEffect } from 'react';
import { districtTowers, landmarks } from '../landmarks';
import { hover, registry, select, useWorld } from '../store';
import { LandmarkIcon } from './LandmarkIcon';

/**
 * Subtle labels anchored to the landmarks: a compact pill (index + name) that
 * expands into a tooltip with the place name and description while the
 * building is hovered or the label is focused. They are real buttons, and the
 * active renderer positions them every frame by writing transforms directly.
 */
export function LandmarkLabels() {
  const overview = useWorld((s) => s.active === 'home' && s.tour === null);
  const hovered = useWorld((s) => s.hovered);
  const hoveredProject = useWorld((s) => s.hoveredProject);

  useEffect(() => {
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const id = (e.target as HTMLElement).dataset.label as (typeof landmarks)[number]['id'];
        const box = e.borderBoxSize?.[0];
        registry.labelSizes.set(id, box ? { w: box.inlineSize, h: box.blockSize } : { w: e.contentRect.width, h: e.contentRect.height });
      }
      window.dispatchEvent(new Event('world:layout'));
    });
    registry.labels.forEach((el) => ro.observe(el));
    return () => ro.disconnect();
  }, []);

  return (
    <nav aria-label="World landmarks" className="pointer-events-none fixed inset-0 z-20 overflow-hidden">
      <ul>
        {landmarks.map((l) => {
          const open = hovered === l.id;
          const detail = l.id === 'projects' && hoveredProject ? `${districtTowers[hoveredProject].name} tower` : l.subtitle;
          return (
            <li key={l.id}>
              <button
                type="button"
                data-label={l.id}
                data-open={open ? '' : undefined}
                ref={(el) => {
                  if (el) registry.labels.set(l.id, el);
                  else registry.labels.delete(l.id);
                }}
                tabIndex={overview ? 0 : -1}
                onClick={() => select(l.id)}
                onPointerEnter={() => hover(l.id)}
                onPointerLeave={() => hover(null)}
                onFocus={() => hover(l.id)}
                onBlur={() => hover(null)}
                aria-label={`${l.index} ${l.title}: ${l.place}. ${l.subtitle}`}
                className={`group pointer-events-auto invisible absolute top-0 left-0 flex max-w-[16rem] items-center gap-2 rounded-full border py-1 pr-3.5 pl-1 text-left opacity-0 shadow-[0_12px_30px_-14px_rgb(0_0_0/0.9)] backdrop-blur-md transition-[opacity,visibility,border-color,background-color,border-radius] duration-300 will-change-transform ${
                  open
                    ? '!rounded-2xl border-gold-300/80 bg-ink-900/90'
                    : 'border-gold-300/25 bg-ink-900/55 hover:border-gold-300/60'
                }`}
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full border transition ${
                    open ? 'border-gold-300/70 bg-gold-300/15 text-gold-200' : 'border-gold-300/30 bg-gold-300/[0.06] text-gold-300'
                  }`}
                >
                  <LandmarkIcon icon={l.icon} size={14} />
                </span>
                <span className="min-w-0 py-0.5">
                  <span className="flex items-baseline gap-1.5 text-[0.8rem] leading-tight font-semibold whitespace-nowrap text-sand-100">
                    <span className="text-[0.65rem] font-medium text-gold-300 tabular-nums">{l.index}</span>
                    {l.title}
                  </span>
                  {open && (
                    <span className="mt-0.5 block text-[0.7rem] leading-snug text-sand-300">
                      <span className="text-gold-200">{l.place}</span> · {detail}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
