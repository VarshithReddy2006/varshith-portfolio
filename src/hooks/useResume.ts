import { useEffect, useState } from 'react';
import { profile } from '../data/content';

let cached: Promise<boolean> | null = null;

/** Checks once whether the resume PDF is actually deployed. */
function checkResume() {
  cached ??= fetch(profile.resumeUrl, { method: 'HEAD' })
    .then((r) => r.ok && (r.headers.get('content-type') ?? '').includes('pdf'))
    .catch(() => false);
  return cached;
}

export interface ResumeLink {
  href: string;
  available: boolean;
  /** Accessible description of what the link does. */
  label: string;
  /** Sensible filename for download links */
  downloadFilename: string;
}

/**
 * Resume action that connects to canonical resume PDF when deployed,
 * otherwise falls back to email request.
 */
export function useResume(): ResumeLink {
  const [available, setAvailable] = useState(true);
  useEffect(() => {
    let alive = true;
    checkResume().then((ok) => alive && setAvailable(ok));
    return () => {
      alive = false;
    };
  }, []);
  return available
    ? {
        href: profile.resumeUrl,
        available,
        label: 'Resume (PDF, opens in a new tab)',
        downloadFilename: profile.resumeDownloadFilename,
      }
    : {
        href: `mailto:${profile.email}?subject=${encodeURIComponent('Resume request')}`,
        available,
        label: 'Request my resume by email',
        downloadFilename: profile.resumeDownloadFilename,
      };
}
