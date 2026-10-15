import { useEffect, type RefObject } from 'react';
import { registry } from '../world/store';

/**
 * Registers an element's screen rect as an area world labels must avoid.
 * Re-measures on resize and after CSS transitions settle.
 */
export function useExclusion(key: string, ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    const el = ref.current;
    const notify = () => window.dispatchEvent(new Event('world:layout'));
    if (!el || !enabled) {
      if (registry.exclusions.delete(key)) notify();
      return;
    }
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden') registry.exclusions.set(key, r);
      else registry.exclusions.delete(key);
      notify();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    el.addEventListener('transitionend', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      el.removeEventListener('transitionend', measure);
      registry.exclusions.delete(key);
      notify();
    };
  }, [key, ref, enabled]);
}
