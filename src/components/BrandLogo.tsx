import React from 'react';

interface BrandLogoProps {
  variant?: 'dark' | 'light' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  logoUrl?: string;
}

export function BrandLogo({ variant = 'dark', size = 'md', logoUrl }: BrandLogoProps) {
  const isDarkBg = variant === 'dark' || variant === 'icon';
  const mainTextColor = isDarkBg ? 'text-white' : 'text-[#090909]';
  const subTextColor = isDarkBg ? 'text-[#E8BE62]' : 'text-[#7A6128]';

  if (logoUrl && logoUrl.trim().length > 0 && variant !== 'icon') {
    return (
      <div className="inline-flex items-center gap-3 shrink-0">
        <img
          src={logoUrl}
          alt="MCFD J GLOBAL VENTURES"
          referrerPolicy="no-referrer"
          className={size === 'sm' ? 'h-9 w-auto object-contain' : 'h-11 w-auto object-contain'}
        />
        <div className="flex flex-col leading-none">
          <span className={`font-serif font-semibold tracking-wider ${mainTextColor} text-lg whitespace-nowrap`}>
            MCFD <span className="text-[#D4AF5A]">J</span>
          </span>
          <span className={`text-[9px] tracking-[0.26em] uppercase ${subTextColor} whitespace-nowrap`}>
            GLOBAL VENTURES
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#090909] border border-[#D4AF5A]/50 shrink-0"
        aria-label="MCFD J GLOBAL VENTURES"
      >
        <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none" aria-hidden="true">
          <path
            d="M15 15L19 9L24 14L29 9L33 15H15Z"
            fill="url(#mcfdjGoldIcon)"
          />
          <path
            d="M28 17V31.5C28 36.2 24.4 39.5 19.6 39.5C15.9 39.5 13.2 37.7 12.2 35.1"
            stroke="url(#mcfdjGoldIcon)"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="mcfdjGoldIcon" x1="12" y1="9" x2="34" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F5DA8B" />
              <stop offset="0.5" stopColor="#D4AF5A" />
              <stop offset="1" stopColor="#A67C2E" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  const scaleClass =
    size === 'sm'
      ? 'scale-90 origin-left'
      : size === 'lg'
      ? 'scale-110 origin-left'
      : '';

  return (
    <div className={`inline-flex items-center select-none shrink-0 ${scaleClass}`}>
      <div className="relative flex flex-col items-start pr-2">
        <div className="flex items-baseline gap-1 relative">
          <span
            className={`font-serif font-semibold tracking-[0.14em] text-xl sm:text-2xl leading-none ${mainTextColor} whitespace-nowrap`}
          >
            MCFD
          </span>
          <div className="relative inline-flex flex-col items-center -mt-3">
            {/* Crown crest above the prominent J */}
            <svg
              viewBox="0 0 28 14"
              className="w-5 h-2.5 mb-0.5"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M2 12L5 4L10.5 8.5L14 2L17.5 8.5L23 4L26 12H2Z"
                fill="url(#mcfdjCrownGrad)"
              />
              <defs>
                <linearGradient id="mcfdjCrownGrad" x1="2" y1="2" x2="26" y2="12" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F6DC93" />
                  <stop offset="0.55" stopColor="#D4AF5A" />
                  <stop offset="1" stopColor="#9C7324" />
                </linearGradient>
              </defs>
            </svg>
            {/* Large distinctive sweeping gold J */}
            <span
              className="font-serif italic font-bold text-3xl sm:text-4xl leading-[0.8] bg-gradient-to-b from-[#F5DC93] via-[#D4AF5A] to-[#9E7628] bg-clip-text text-transparent pr-1"
              style={{ textShadow: '0 1px 12px rgba(212,175,90,0.18)' }}
            >
              J
            </span>
          </div>
        </div>
        {/* Gold curved underline swoop connecting beneath MCFD J */}
        <svg
          viewBox="0 0 160 12"
          className="w-36 h-2.5 -mt-1"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 9C38 11 94 11 136 2"
            stroke="url(#mcfdjSwoosh)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="mcfdjSwoosh" x1="4" y1="9" x2="136" y2="2" gradientUnits="userSpaceOnUse">
              <stop stopColor="#D4AF5A" stopOpacity="0.2" />
              <stop offset="0.5" stopColor="#E8BE62" />
              <stop offset="1" stopColor="#D4AF5A" />
            </linearGradient>
          </defs>
        </svg>
        <span
          className={`text-[9px] font-medium tracking-[0.28em] uppercase mt-0.5 ${subTextColor} whitespace-nowrap`}
        >
          GLOBAL VENTURES
        </span>
      </div>
    </div>
  );
}
