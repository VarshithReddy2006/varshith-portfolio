import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  size?: 'md' | 'lg';
}

/**
 * Accessible modal built on the native <dialog> element:
 * focus trapping, Esc to close and inert background come for free.
 * Focus returns to the element that opened it.
 */
export function Dialog({ open, onClose, title, subtitle, children, size = 'lg' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  const titleId = useId();

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      opener.current = document.activeElement;
      dlg.showModal();
      document.documentElement.style.overflow = 'hidden';
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    const handleClose = () => {
      document.documentElement.style.overflow = '';
      if (opener.current instanceof HTMLElement) opener.current.focus();
      onClose();
    };
    dlg.addEventListener('close', handleClose);
    return () => dlg.removeEventListener('close', handleClose);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (e.target === e.currentTarget) ref.current?.close();
      }}
      className={`m-auto w-[calc(100%-2rem)] ${size === 'lg' ? 'max-w-3xl' : 'max-w-xl'} max-h-[88dvh] overflow-hidden rounded-2xl border border-gold-300/20 bg-ink-850 p-0 text-sand-200 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)] open:flex open:flex-col`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
        <div>
          <h2 id={titleId} className="text-xl font-semibold sm:text-2xl">
            {title}
          </h2>
          {subtitle && <p className="mt-1 text-sm text-gold-200">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="-mr-2 rounded-lg p-2 text-sand-300 transition hover:bg-white/5 hover:text-sand-100"
          aria-label="Close dialog"
        >
          <X size={20} aria-hidden />
        </button>
      </div>
      <div className="overflow-y-auto px-6 py-6">{open && children}</div>
    </dialog>
  );
}
