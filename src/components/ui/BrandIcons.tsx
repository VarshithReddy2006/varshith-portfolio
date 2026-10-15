import type { JSX, SVGProps } from 'react';
import type { SocialId } from '../../data/content';

/**
 * Inline brand marks (Lucide v1 no longer ships brand icons).
 * Decorative by default: callers provide accessible names on the link.
 */
type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const base = (size: number, props: IconProps) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'currentColor',
  'aria-hidden': true,
  focusable: false,
  ...props,
});

export function GithubIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.82-.26.82-.58v-2.03c-3.34.73-4.04-1.6-4.04-1.6-.55-1.4-1.34-1.77-1.34-1.77-1.08-.74.09-.73.09-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3" />
    </svg>
  );
}

export function LinkedinIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .77 0 1.73v20.54C0 23.23.8 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  );
}

export function LeetcodeIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M13.48 0a1.37 1.37 0 0 0-.96.44L7.12 6.23l-3.86 4.12a5.27 5.27 0 0 0-1.33 2.62 5.53 5.53 0 0 0 .06 2.36c.08.35.2.69.35 1.02.3.68.73 1.3 1.27 1.82l4.28 4.19.04.04c2.25 2.17 5.85 2.13 8.06-.07l2.4-2.4a1.38 1.38 0 0 0-1.95-1.95l-2.4 2.39a3.02 3.02 0 0 1-4.2.04l-.02-.02-4.28-4.19c-.65-.64-.97-1.47-.95-2.26.01-.18.03-.36.07-.53.1-.43.31-.83.62-1.16l3.86-4.13c1.06-1.14 3.2-1.27 4.43-.28l3.5 2.83a1.38 1.38 0 1 0 1.73-2.15l-3.5-2.83a5.85 5.85 0 0 0-2.77-1.2l2.01-2.16A1.38 1.38 0 0 0 13.48 0Zm-2.86 12.82a1.38 1.38 0 1 0 0 2.76h10.17a1.38 1.38 0 1 0 0-2.76Z" />
    </svg>
  );
}

export function CodeforcesIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg {...base(size, props)}>
      <path d="M4.5 7.5C5.33 7.5 6 8.17 6 9v10.5c0 .83-.67 1.5-1.5 1.5h-3C.67 21 0 20.33 0 19.5V9c0-.83.67-1.5 1.5-1.5h3Zm9-4.5c.83 0 1.5.67 1.5 1.5v15c0 .83-.67 1.5-1.5 1.5h-3c-.83 0-1.5-.67-1.5-1.5v-15c0-.83.67-1.5 1.5-1.5h3Zm9 7.5c.83 0 1.5.67 1.5 1.5v7.5c0 .83-.67 1.5-1.5 1.5h-3c-.83 0-1.5-.67-1.5-1.5V12c0-.83.67-1.5 1.5-1.5h3Z" />
    </svg>
  );
}

export const brandIcons: Record<SocialId, (p: IconProps) => JSX.Element> = {
  linkedin: LinkedinIcon,
  github: GithubIcon,
  leetcode: LeetcodeIcon,
  codeforces: CodeforcesIcon,
};
