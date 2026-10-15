import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react';
import type { LandmarkId, ProjectId } from '../landmarks';
import { hashFor, select } from '../store';

interface WorldLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  to: LandmarkId;
  project?: ProjectId | null;
  children: ReactNode;
}

/**
 * A real link (`#projects/aria`) that navigates the world in place.
 * Modified clicks (new tab, etc.) fall through to the browser.
 */
export function WorldLink({ to, project = null, onClick, children, ...rest }: WorldLinkProps) {
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    select(to, { project });
  };
  return (
    <a href={hashFor(to, project)} onClick={handle} {...rest}>
      {children}
    </a>
  );
}
