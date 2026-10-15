import { useState } from 'react';
import { Check, Copy, FileText, Mail, MapPin, Phone, Send } from 'lucide-react';
import { contact, profile } from '../data/content';
import { SocialLinks } from '../components/ui/SocialLinks';
import { useResume } from '../hooks/useResume';

export default function ContactPanel() {
  const [copied, setCopied] = useState(false);
  const resume = useResume();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: the mailto link still works */
    }
  };

  const row = 'flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3.5';
  const icon = 'grid size-10 shrink-0 place-items-center rounded-lg border border-gold-300/25 bg-gold-300/[0.07] text-gold-300';

  return (
    <div className="space-y-7">
      <div>
        <h3 className="text-2xl leading-tight font-semibold sm:text-3xl">{contact.heading}</h3>
        <p className="mt-3 leading-relaxed text-sand-300">{contact.description}</p>
      </div>

      <address className="grid gap-3 not-italic">
        <div className={row}>
          <span className={icon}>
            <Mail size={18} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-sand-400">Email</p>
            <a href={`mailto:${profile.email}`} className="link-underline break-all text-sand-100 hover:text-gold-200">
              {profile.email}
            </a>
          </div>
          <button
            type="button"
            onClick={copy}
            className="grid size-11 shrink-0 place-items-center rounded-lg text-sand-300 transition hover:bg-white/5 hover:text-gold-200"
            aria-label={copied ? 'Email copied' : 'Copy email address'}
          >
            {copied ? <Check size={17} aria-hidden /> : <Copy size={17} aria-hidden />}
          </button>
        </div>
        <div className={row}>
          <span className={icon}>
            <Phone size={18} aria-hidden />
          </span>
          <div>
            <p className="text-xs text-sand-400">Phone</p>
            <a href={profile.phoneHref} className="link-underline text-sand-100 hover:text-gold-200">
              {profile.phone}
            </a>
          </div>
        </div>
        <div className={row}>
          <span className={icon}>
            <MapPin size={18} aria-hidden />
          </span>
          <div>
            <p className="text-xs text-sand-400">Location</p>
            <p className="text-sand-100">{profile.location}</p>
          </div>
        </div>
      </address>
      <p role="status" className="sr-only">
        {copied ? 'Email address copied to clipboard' : ''}
      </p>

      <div className="flex flex-wrap gap-3">
        <a href={`mailto:${profile.email}?subject=${encodeURIComponent("Let's work together")}`} className="btn btn-primary">
          <Send size={16} aria-hidden /> Start a conversation
        </a>
        <a
          href={resume.href}
          target={resume.available ? '_blank' : undefined}
          rel="noopener noreferrer"
          download={resume.available ? resume.downloadFilename : undefined}
          className="btn btn-ghost"
          aria-label={resume.label}
        >
          <FileText size={16} aria-hidden /> {resume.available ? 'Resume' : 'Request Resume'}
        </a>
      </div>

      <div>
        <h3 className="text-xs font-semibold tracking-wider text-sand-400 uppercase">Find me online</h3>
        <SocialLinks variant="icon" className="mt-3" />
      </div>

      <p className="border-t border-white/[0.06] pt-5 text-xs text-sand-400">© 2026 Shavva Varshith Reddy. Built with React and Three.js.</p>
    </div>
  );
}
