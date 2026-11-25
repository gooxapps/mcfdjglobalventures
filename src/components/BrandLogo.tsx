import React from 'react';

export const DEFAULT_BRAND_LOGO_URL = '/assets/aistudio/image_d50773ba.png';

interface BrandLogoProps {
  variant?: 'dark' | 'light' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  logoUrl?: string;
}

export function BrandLogo({ variant = 'dark', size = 'md', logoUrl }: BrandLogoProps) {
  const effectiveLogoUrl =
    logoUrl && logoUrl.trim().length > 0 ? logoUrl.trim() : DEFAULT_BRAND_LOGO_URL;

  const isDarkBg = variant === 'dark' || variant === 'icon';
  const mainTextColor = isDarkBg ? 'text-white' : 'text-[#2D0D31]';
  const subTextColor = isDarkBg ? 'text-[#F3E6D3]' : 'text-[#3B183E]';
  const jGradientClass = isDarkBg
    ? 'from-[#F6DC93] via-[#E8BE62] to-[#C89635]'
    : 'from-[#C89635] via-[#B47E22] to-[#7D5211]';

  if (variant === 'icon') {
    return (
      <div
        className="inline-flex items-center justify-center w-10 h-10 rounded-full overflow-hidden bg-[#DFD5C6] ring-1 ring-[#D4AF5A]/65 shadow-sm shrink-0"
        aria-label="MCFD J Global Ventures"
      >
        <img
          src={effectiveLogoUrl}
          alt="MCFD J Global Ventures"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover scale-105"
        />
      </div>
    );
  }

  const sizeClasses =
    size === 'sm'
      ? { emblem: 'w-10 h-10 sm:w-11 sm:h-11', title: 'text-xl', sub: 'text-[11px]' }
      : size === 'lg'
      ? { emblem: 'w-14 h-14 sm:w-16 sm:h-16', title: 'text-3xl', sub: 'text-sm' }
      : { emblem: 'w-12 h-12', title: 'text-2xl', sub: 'text-xs' };

  return (
    <div className="inline-flex items-center gap-2.5 select-none shrink-0">
      <div
        className={`${sizeClasses.emblem} rounded-full overflow-hidden bg-[#DFD5C6] ring-1 ring-[#D4AF5A]/65 shadow-sm shrink-0`}
      >
        <img
          src={effectiveLogoUrl}
          alt="MCFD J Global Ventures Logo"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover scale-105"
        />
      </div>

      {/* Stacked Serif Brand Wordmark */}
      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1">
          <span
            className={`font-serif font-bold tracking-[0.06em] ${sizeClasses.title} ${mainTextColor} whitespace-nowrap`}
          >
            MCFD
          </span>
          <span
            className={`font-serif font-bold bg-gradient-to-b ${jGradientClass} bg-clip-text text-transparent ${sizeClasses.title}`}
          >
            J
          </span>
        </div>
        <span
          className={`font-serif font-medium tracking-[0.05em] ${sizeClasses.sub} ${subTextColor} whitespace-nowrap -mt-0.5`}
        >
          Global Ventures
        </span>
      </div>
    </div>
  );
}
