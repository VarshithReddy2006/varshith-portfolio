import { useState } from 'react';
import { Camera } from 'lucide-react';

interface PortraitProps {
  src: string;
  alt: string;
  className?: string;
  /** Compact mode renders only the monogram when the photo is missing. */
  compact?: boolean;
  loading?: 'lazy' | 'eager';
  width?: number;
  height?: number;
}

/**
 * Shows the owner's real photo from /public/images. If the file has not been
 * added yet, a neutral CSS placeholder is shown instead — never a generated face.
 */
export function Portrait({ src, alt, className = '', compact = false, loading = 'lazy', width, height }: PortraitProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        role="img"
        aria-label={`${alt} (photo placeholder)`}
        className={`relative grid place-items-center overflow-hidden bg-ink-800 ${className}`}
        style={{
          backgroundImage:
            'radial-gradient(120% 80% at 50% 0%, rgb(232 197 138 / 0.16), transparent 60%), repeating-linear-gradient(135deg, rgb(255 255 255 / 0.025) 0 2px, transparent 2px 12px)',
        }}
      >
        {compact ? (
          <span className="text-[0.68rem] font-semibold tracking-wider text-gold-300">SVR</span>
        ) : (
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="grid size-14 place-items-center rounded-full border border-gold-300/40 text-lg font-semibold tracking-wider text-gold-300">
              SVR
            </span>
            <span className="flex items-center gap-1.5 text-xs text-sand-400">
              <Camera size={14} aria-hidden /> Photo coming soon
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={loading}
      decoding="async"
      width={width}
      height={height}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}
