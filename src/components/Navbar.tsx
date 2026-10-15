import { useEffect, useState } from 'react';
import { ArrowRight, FileText, Menu, X } from 'lucide-react';
import { navLinks, socialHref } from '../data/content';
import { useResume } from '../hooks/useResume';
import { landmarks } from '../world/landmarks';
import { useWorld } from '../world/store';
import { LandmarkIcon } from '../world/ui/LandmarkIcon';
import { WorldLink } from '../world/ui/WorldLink';
import { GithubIcon, LeetcodeIcon } from './ui/BrandIcons';
import { SocialLinks } from './ui/SocialLinks';

const iconOf = (id: string) => landmarks.find((l) => l.id === id)!.icon;

/**
 * Compact top navigation. Every link goes through the same world selection
 * logic as clicking a landmark (WorldLink → select()).
 */
export function Navbar() {
  const active = useWorld((s) => s.active);
  const [open, setOpen] = useState(false);
  const resume = useResume();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
      }
    };
    const mql = window.matchMedia('(min-width: 1024px)');
    const onMql = () => mql.matches && setOpen(false);
    window.addEventListener('keydown', onKey, true);
    mql.addEventListener('change', onMql);
    return () => {
      window.removeEventListener('keydown', onKey, true);
      mql.removeEventListener('change', onMql);
    };
  }, [open]);

  const iconBtn = 'grid size-10 place-items-center rounded-lg text-sand-200 transition hover:bg-white/5 hover:text-gold-300';

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink-950/85 via-ink-950/40 to-transparent" />
      <nav aria-label="Primary" className="container-x relative flex h-[var(--nav-h)] items-center justify-between gap-4">
        <WorldLink
          to="home"
          data-brand
          className="text-lg font-bold tracking-[0.18em] text-sand-100 transition hover:text-gold-300"
          aria-label="SVR — world overview"
        >
          SVR
        </WorldLink>

        <ul className="hidden items-center gap-1 lg:flex">
          {navLinks.map(({ id, label }) => {
            const isActive = active === id;
            return (
              <li key={id}>
                <WorldLink
                  to={id}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative block rounded-md px-3.5 py-2 text-sm transition ${isActive ? 'text-sand-100' : 'text-sand-300 hover:text-sand-100'}`}
                >
                  {label}
                  <span
                    aria-hidden
                    className={`absolute -bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full bg-gold-300 transition-transform duration-300 ${isActive ? 'scale-100' : 'scale-0'}`}
                  />
                </WorldLink>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1">
          <a href={socialHref('github')} target="_blank" rel="noopener noreferrer" className={iconBtn} aria-label="GitHub profile (opens in a new tab)">
            <GithubIcon size={18} />
          </a>
          <a href={socialHref('leetcode')} target="_blank" rel="noopener noreferrer" className={`${iconBtn} hidden sm:grid`} aria-label="LeetCode profile (opens in a new tab)">
            <LeetcodeIcon size={18} />
          </a>
          <span aria-hidden className="mx-1 hidden h-5 w-px bg-white/15 sm:block" />
          <a
            href={resume.href}
            target={resume.available ? '_blank' : undefined}
            rel="noopener noreferrer"
            className={`${iconBtn} sm:flex sm:w-auto sm:items-center sm:gap-2 sm:px-3 sm:text-sm`}
            aria-label={resume.label}
            title={resume.available ? 'View Resume (PDF)' : 'Resume PDF not uploaded yet — request it by email'}
          >
            <FileText size={18} aria-hidden />
            <span className="hidden sm:inline" aria-hidden>
              Resume
            </span>
          </a>
          <WorldLink to="contact" className="btn btn-ghost ml-2 hidden !px-4 !py-2 lg:inline-flex">
            Let’s Connect <ArrowRight size={15} aria-hidden />
          </WorldLink>
          <button
            type="button"
            className={`${iconBtn} lg:hidden`}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </nav>

      <div id="mobile-menu" hidden={!open} className="relative border-y border-white/[0.06] bg-ink-900/95 backdrop-blur-xl lg:hidden">
        <ul className="container-x grid gap-1 py-4 sm:grid-cols-2">
          {navLinks.map(({ id, label }) => (
            <li key={id}>
              <WorldLink
                to={id}
                onClick={() => setOpen(false)}
                aria-current={active === id ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-base transition ${
                  active === id ? 'bg-gold-300/10 text-gold-200' : 'text-sand-200 hover:bg-white/5'
                }`}
              >
                <LandmarkIcon icon={iconOf(id)} size={18} className="text-gold-300" />
                {label}
              </WorldLink>
            </li>
          ))}
        </ul>
        <div className="container-x flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.06] py-4">
          <SocialLinks variant="icon" />
          <WorldLink to="contact" onClick={() => setOpen(false)} className="btn btn-primary">
            Let’s Connect <ArrowRight size={16} aria-hidden />
          </WorldLink>
        </div>
      </div>
    </header>
  );
}
