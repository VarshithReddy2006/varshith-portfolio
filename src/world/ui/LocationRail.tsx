import { useRef } from 'react';
import { useExclusion } from '../../hooks/useExclusion';
import { landmarks } from '../landmarks';
import { useWorld } from '../store';
import { WorldLink } from './WorldLink';

/**
 * Small "you are here" aid on the left edge: one dot per landmark, the
 * current one elongated with its name. Uses the same links as the navbar.
 */
export function LocationRail() {
  const active = useWorld((s) => s.active);
  const atHome = active === 'home';
  const list = useRef<HTMLOListElement>(null);
  useExclusion('rail', list);

  return (
    <nav aria-label="Current location" className="fixed top-1/2 left-3 z-30 hidden -translate-y-1/2 md:block xl:left-5">
      <ol ref={list} className="flex flex-col gap-1">
        {landmarks.map((l) => {
          const on = l.id === active;
          return (
            <li key={l.id}>
              <WorldLink
                to={l.id}
                aria-current={on ? 'location' : undefined}
                aria-label={`${l.index} ${l.title} — ${l.place}`}
                className="group flex h-6 items-center gap-2 rounded-full px-1.5"
              >
                <span
                  aria-hidden
                  className={`block w-1.5 rounded-full transition-all duration-300 ${
                    on ? 'h-5 bg-gold-300 shadow-[0_0_10px_rgb(232_197_138/0.6)]' : 'h-1.5 bg-sand-400/45 group-hover:bg-gold-200 group-focus-visible:bg-gold-200'
                  }`}
                />
                <span
                  aria-hidden
                  className={`rounded-md bg-ink-900/70 px-1.5 py-0.5 text-[0.68rem] whitespace-nowrap backdrop-blur transition-opacity duration-300 ${
                    on && !atHome ? 'text-gold-200 opacity-100' : 'text-sand-300 opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
                  }`}
                >
                  <span className="tabular-nums">{l.index}</span> {on ? l.place : l.title}
                </span>
              </WorldLink>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
