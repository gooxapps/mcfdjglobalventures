import React from 'react';

interface BrandLogoProps {
  variant?: 'dark' | 'light' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  logoUrl?: string;
}

export function BrandLogo({ variant = 'dark', size = 'md', logoUrl }: BrandLogoProps) {
  const isDarkBg = variant === 'dark' || variant === 'icon';
  const mainTextColor = isDarkBg ? 'text-white' : 'text-[#2D0D31]';
  const subTextColor = isDarkBg ? 'text-[#F3E6D3]' : 'text-[#3B183E]';
  const jGradientClass = isDarkBg
    ? 'from-[#F6DC93] via-[#E8BE62] to-[#C89635]'
    : 'from-[#C89635] via-[#B47E22] to-[#7D5211]';

  if (logoUrl && logoUrl.trim().length > 0 && variant !== 'icon') {
    return (
      <div className="inline-flex items-center gap-2.5 shrink-0">
        <img
          src={logoUrl}
          alt="MCFD J Global Ventures"
          referrerPolicy="no-referrer"
          className={size === 'sm' ? 'h-9 w-auto object-contain' : 'h-11 w-auto object-contain'}
        />
        <div className="flex flex-col leading-none">
          <span className={`font-serif font-semibold tracking-wider ${mainTextColor} text-lg whitespace-nowrap`}>
            MCFD <span className="text-[#D4AF5A]">J</span>
          </span>
          <span className={`text-[10px] tracking-[0.16em] ${subTextColor} whitespace-nowrap`}>
            Global Ventures
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#250628] border border-[#D4AF5A]/50 shrink-0"
        aria-label="MCFD J Global Ventures"
      >
        <svg viewBox="0 0 48 48" className="w-7 h-7" fill="none" aria-hidden="true">
          <path d="M24 7L27.5 11.5L24 14.5L20.5 11.5L24 7Z" fill="url(#mcfdjDressGold)" />
          <path
            d="M20.5 15.5C22.2 14.8 25.8 14.8 27.5 15.5L29 21L35.5 39H12.5L19 21L20.5 15.5Z"
            fill="url(#mcfdjDressGold)"
          />
          <path d="M24 21L17.5 39M24 21L30.5 39" stroke="#250628" strokeWidth="1.2" strokeLinecap="round" />
          <defs>
            <linearGradient id="mcfdjDressGold" x1="12" y1="7" x2="36" y2="40" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F5DA8B" />
              <stop offset="0.55" stopColor="#D4AF5A" />
              <stop offset="1" stopColor="#9C6E21" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  const sizeClasses =
    size === 'sm'
      ? { emblem: 'w-8 h-10', title: 'text-xl', sub: 'text-[11px]' }
      : size === 'lg'
      ? { emblem: 'w-11 h-14', title: 'text-3xl', sub: 'text-sm' }
      : { emblem: 'w-9 h-12', title: 'text-2xl', sub: 'text-xs' };

  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      {/* Couture gown & crown silhouette emblem */}
      <svg
        viewBox="0 0 56 76"
        className={`${sizeClasses.emblem} shrink-0`}
        fill="none"
        aria-hidden="true"
      >
        {/* Neck / bust crest */}
        <path
          d="M28 5C29.7 5 31 6.3 31 8C31 9.5 29.8 10.7 28.4 10.9V13.5C31.5 14.2 33.4 16.5 33.4 19.6C33.4 22.8 31.3 25.4 30.8 29.5L47.5 64.5C48.2 66 47.4 67.6 45.8 68C39.8 69.5 34.4 70.5 28 70.5C21.6 70.5 16.2 69.5 10.2 68C8.6 67.6 7.8 66 8.5 64.5L25.2 29.5C24.7 25.4 22.6 22.8 22.6 19.6C22.6 16.5 24.5 14.2 27.6 13.5V10.9C26.2 10.7 25 9.5 25 8C25 6.3 26.3 5 28 5Z"
          fill={isDarkBg ? '#D4AF5A' : '#3B0E3F'}
        />
        {/* Flowing gold pleats along gown skirt */}
        <path
          d="M28 31.5L15.5 65.8M28 31.5L22.5 67.5M28 31.5L28 68.2M28 31.5L33.5 67.5M28 31.5L40.5 65.8"
          stroke={isDarkBg ? '#250628' : '#E8BE62'}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        {/* Golden sash at waist */}
        <path
          d="M23.6 29.2C26.3 30.8 29.7 30.8 32.4 29.2"
          stroke="#E8BE62"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>

      {/* Stacked Serif Brand Wordmark */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1">
          <span className={`font-serif font-bold tracking-[0.06em] ${sizeClasses.title} ${mainTextColor} whitespace-nowrap`}>
            MCFD
          </span>
          <span
            className={`font-serif font-bold bg-gradient-to-b ${jGradientClass} bg-clip-text text-transparent ${sizeClasses.title}`}
          >
            J
          </span>
        </div>
        <span className={`font-serif font-medium tracking-[0.05em] ${sizeClasses.sub} ${subTextColor} whitespace-nowrap -mt-0.5`}>
          Global Ventures
        </span>
      </div>
    </div>
  );
}
