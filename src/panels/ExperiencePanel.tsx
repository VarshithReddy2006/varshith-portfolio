import { CalendarRange, HeartPulse } from 'lucide-react';
import { experience } from '../data/content';
import { GithubIcon } from '../components/ui/BrandIcons';
import { WorldLink } from '../world/ui/WorldLink';

/** Wraps known identifiers in <code> for readability. */
function withCode(text: string) {
  return text.split(/(archiveVoidedObs|NOT EXISTS|N\+1)/g).map((p, i) =>
    i % 2 === 1 ? (
      <code key={i} className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.85em] text-gold-200">
        {p}
      </code>
    ) : (
      p
    ),
  );
}

export default function ExperiencePanel() {
  return (
    <div className="space-y-6">
      <article aria-labelledby="exp-openmrs" className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-xl border border-gold-300/30 bg-gold-300/[0.08] text-gold-300">
              <HeartPulse size={22} aria-hidden />
            </span>
            <div>
              <h3 id="exp-openmrs" className="text-xl font-semibold">
                {experience.org}
              </h3>
              <p className="text-sm font-medium text-gold-200">{experience.role}</p>
            </div>
          </div>
          <p className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-1.5 text-xs text-sand-300">
            <CalendarRange size={14} aria-hidden /> {experience.dates}
          </p>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-sand-300">
          OpenMRS is an open-source medical records platform used by health programs worldwide. My work focused on the Java backend
          in openmrs-core.
        </p>

        <ul className="mt-5 space-y-4">
          {experience.points.map((p) => (
            <li key={p} className="flex gap-3 leading-relaxed text-sand-200">
              <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-gold-300" />
              <span>{withCode(p)}</span>
            </li>
          ))}
        </ul>

        <a href={experience.href} target="_blank" rel="noopener noreferrer" className="btn btn-ghost mt-7">
          <GithubIcon size={16} /> View on GitHub
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </article>

      <p className="text-sm text-sand-400">
        More open-source milestones, including GirlScript Summer of Code 2026, are in the{' '}
        <WorldLink to="achievements" className="link-underline text-gold-200">
          Hall of Achievements
        </WorldLink>
        .
      </p>
    </div>
  );
}
