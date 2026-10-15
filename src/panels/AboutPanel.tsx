import { Boxes, Calendar, Code, Cpu, Database, FileText, Gauge, GraduationCap, Layout, MapPin, Quote, Server, type LucideIcon } from 'lucide-react';
import { about, profile, skills } from '../data/content';
import { Portrait } from '../components/ui/Portrait';
import { SocialLinks } from '../components/ui/SocialLinks';
import { useResume } from '../hooks/useResume';

const factIcons: Record<(typeof about.facts)[number]['icon'], LucideIcon> = {
  pin: MapPin,
  grad: GraduationCap,
  gauge: Gauge,
  calendar: Calendar,
};

const skillIcons: Record<(typeof skills)[number]['group'], LucideIcon> = {
  Languages: Code,
  Frontend: Layout,
  Backend: Server,
  Databases: Database,
  'Tools & Platforms': Boxes,
  'Core CS': Cpu,
};

export default function AboutPanel() {
  const resume = useResume();
  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]">
        <div className="relative w-full max-w-[11rem] sm:max-w-none">
          <div
            aria-hidden
            className="absolute -inset-3 -z-10 rounded-[1.4rem]"
            style={{ background: 'radial-gradient(60% 55% at 50% 45%, rgb(232 197 138 / 0.2), transparent 70%)' }}
          />
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] p-1.5">
            <Portrait
              src={profile.portraitAbout}
              alt="Shavva Varshith Reddy, Computer Science student at CVR College of Engineering"
              width={640}
              height={800}
              className="aspect-[4/5] w-full rounded-xl"
            />
          </div>
        </div>
        <div className="flex flex-col justify-between gap-5">
          <div>
            <h3 className="text-xl font-semibold">{about.title}</h3>
            <p className="mt-3 leading-relaxed text-sand-300">{about.description}</p>
          </div>
          <figure className="rounded-2xl border border-gold-300/20 bg-gold-300/[0.04] p-5">
            <Quote size={18} className="text-gold-300" aria-hidden />
            <blockquote className="mt-2 text-xl leading-snug font-medium text-sand-100">{about.quote}</blockquote>
            <figcaption className="mt-2 text-xs text-gold-200">— Varshith</figcaption>
          </figure>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-2">
        {about.facts.map((f) => {
          const Icon = factIcons[f.icon];
          return (
            <div key={f.label} className="grid grid-cols-[2.5rem_1fr] items-center gap-x-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5">
              <dt className="contents">
                <span className="row-span-2 grid size-10 place-items-center rounded-lg border border-gold-300/25 bg-gold-300/[0.07] text-gold-300">
                  <Icon size={18} aria-hidden />
                </span>
                <span className="self-end text-[0.7rem] tracking-wide text-sand-400 uppercase">{f.label}</span>
              </dt>
              <dd className="col-start-2 self-start font-semibold text-sand-100">
                {f.value}
                {'sub' in f && <span className="block text-xs font-normal text-sand-400">{f.sub}</span>}
              </dd>
            </div>
          );
        })}
      </dl>

      <div>
        <h3 className="text-xs font-semibold tracking-wider text-sand-400 uppercase">Professional profiles</h3>
        <SocialLinks className="mt-3" />
        <a
          href={resume.href}
          target={resume.available ? '_blank' : undefined}
          rel="noopener noreferrer"
          download={resume.available ? resume.downloadFilename : undefined}
          className="btn btn-ghost mt-5"
          aria-label={resume.label}
        >
          <FileText size={16} aria-hidden /> {resume.available ? 'Download Resume' : 'Request Resume'}
        </a>
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wider text-sand-400 uppercase">Technical skills</h3>
        <ul className="mt-3 grid gap-3">
          {skills.map((s) => {
            const Icon = skillIcons[s.group];
            return (
              <li key={s.group} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                <h4 className="flex items-center gap-2.5 text-sm font-semibold">
                  <Icon size={16} className="text-gold-300" aria-hidden />
                  {s.group}
                </h4>
                <ul aria-label={`${s.group} skills`} className="mt-3 flex flex-wrap gap-1.5">
                  {s.items.map((item) => (
                    <li key={item} className="chip">
                      {item}
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
