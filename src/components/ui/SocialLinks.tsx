import { socials, type SocialId } from '../../data/content';
import { brandIcons } from './BrandIcons';

interface SocialLinksProps {
  variant?: 'inline' | 'icon';
  only?: SocialId[];
  className?: string;
}

/** Social profile links. `inline` shows icon + label, `icon` shows round icon buttons. */
export function SocialLinks({ variant = 'inline', only, className = '' }: SocialLinksProps) {
  const list = only ? socials.filter((s) => only.includes(s.id)) : socials;
  return (
    <ul className={`flex flex-wrap items-center ${variant === 'icon' ? 'gap-3' : 'gap-x-5 gap-y-3'} ${className}`}>
      {list.map(({ id, label, href }) => {
        const Icon = brandIcons[id];
        return (
          <li key={id}>
            {variant === 'icon' ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`${label} (opens in a new tab)`}
                className="grid size-11 place-items-center rounded-xl border border-white/10 bg-white/[0.03] text-sand-200 transition hover:-translate-y-0.5 hover:border-gold-300/50 hover:text-gold-300"
              >
                <Icon size={18} />
              </a>
            ) : (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 py-1 text-sm text-sand-300 transition hover:text-gold-200"
              >
                <Icon size={16} />
                <span className="link-underline">{label}</span>
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            )}
          </li>
        );
      })}
    </ul>
  );
}
