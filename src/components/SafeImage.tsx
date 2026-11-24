import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

interface SafeImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  alt: string;
  fallbackLabel?: string;
}

export function SafeImage({
  src,
  alt,
  fallbackLabel,
  className = '',
  loading = 'lazy',
  ...rest
}: SafeImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#1A1A1A] via-[#090909] to-[#241E12] text-[#D4AF5A] p-4 text-center ${className}`}
      >
        <Sparkles className="w-6 h-6 mb-2 opacity-80" strokeWidth={1.5} />
        <span className="font-serif text-sm tracking-wide text-[#FAF5EE]/90 line-clamp-2">
          {fallbackLabel || alt || 'MCFD J'}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      loading={loading}
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
