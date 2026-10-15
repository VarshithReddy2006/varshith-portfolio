import { Award, GitPullRequest, Star, Trophy, type LucideIcon } from 'lucide-react';
import { achievements, competitiveStats, socialHref } from '../data/content';
import { CodeforcesIcon, LeetcodeIcon } from '../components/ui/BrandIcons';

const icons: Record<(typeof achievements)[number]['icon'], LucideIcon> = {
  trophy: Trophy,
  star: Star,
  pr: GitPullRequest,
  award: Award, // certificate / award mark for the Oracle certification
};

export default function AchievementsPanel() {
  return (
    <div className="space-y-6">
      <ul className="grid gap-3 sm:grid-cols-2">
        {achievements.map((a) => {
          const Icon = icons[a.icon];
          return (
            <li key={a.id} className="flex flex-col rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
              <span className="grid size-11 place-items-center rounded-xl border border-gold-300/30 bg-gold-300/[0.08] text-gold-300">
                <Icon size={20} aria-hidden />
              </span>
              <h3 className="mt-4 text-base leading-snug font-semibold">{a.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-sand-300">{a.body}</p>
            </li>
          );
        })}
      </ul>

      <div className="rounded-2xl border border-gold-300/20 bg-gold-300/[0.04] p-5">
        <h3 className="text-xs font-semibold tracking-wider text-gold-200 uppercase">Competitive programming</h3>
        <dl className="mt-3 grid grid-cols-3 gap-3">
          {competitiveStats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse">
              <dt className="text-xs text-sand-400">{s.label}</dt>
              <dd className="text-xl sm:text-2xl font-semibold text-sand-100">{s.value}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={socialHref('leetcode')} target="_blank" rel="noopener noreferrer" className="btn btn-ghost !py-2">
            <LeetcodeIcon size={15} /> LeetCode profile<span className="sr-only"> (opens in a new tab)</span>
          </a>
          <a href={socialHref('codeforces')} target="_blank" rel="noopener noreferrer" className="btn btn-quiet !py-2">
            <CodeforcesIcon size={15} /> Codeforces<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
