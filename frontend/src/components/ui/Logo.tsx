import React, { useState } from 'react';
import logoHorizontal from '../../assets/logo-horizontal.png';
import iconImg from '../../assets/icon.png';
import fullLogo from '../../assets/logo.jpg';

export interface LogoProps {
  variant?: 'horizontal' | 'icon' | 'full';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  alt?: string;
  showBadge?: boolean;
  badgeText?: string;
}

const SIZE_STYLES = {
  xs: {
    icon: 'w-6 h-6',
    horizontal: 'h-6',
    full: 'w-7 h-7',
  },
  sm: {
    icon: 'w-8 h-8',
    horizontal: 'h-8',
    full: 'w-10 h-10',
  },
  md: {
    icon: 'w-10 h-10',
    horizontal: 'h-10',
    full: 'w-12 h-12',
  },
  lg: {
    icon: 'w-12 h-12',
    horizontal: 'h-12',
    full: 'w-16 h-16',
  },
  xl: {
    icon: 'w-16 h-16',
    horizontal: 'h-16',
    full: 'w-24 h-24',
  },
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  className = '',
  alt = 'Smart Employee Logo',
  showBadge = false,
  badgeText = 'Smart ATS',
}) => {
  const [imgError, setImgError] = useState(false);

  const getSrc = () => {
    switch (variant) {
      case 'icon':
        return iconImg;
      case 'full':
        return fullLogo;
      case 'horizontal':
      default:
        return logoHorizontal;
    }
  };

  const currentSizeClass = SIZE_STYLES[size][variant];

  if (imgError) {
    return (
      <div
        className={`flex items-center justify-center font-bold bg-[#d1dbd2] text-[#1c3836] rounded-xl border border-[#b8c7ba] ${
          variant === 'icon' ? currentSizeClass : 'h-10 px-3'
        } ${className}`}
      >
        <span className="text-xs uppercase tracking-wider font-extrabold">SE</span>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <div className={`relative inline-flex items-center shrink-0 ${className}`}>
        <img
          src={getSrc()}
          alt={alt}
          className={`${currentSizeClass} object-contain rounded-xl shadow-xs transition hover:scale-105`}
          onError={() => setImgError(true)}
        />
        {showBadge && (
          <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
        )}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        <img
          src={getSrc()}
          alt={alt}
          className={`${currentSizeClass} object-contain rounded-2xl shadow-sm border border-slate-200/60 bg-[#d1dbd2] p-1 transition hover:shadow-md`}
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 shrink-0 ${className}`}>
      <img
        src={getSrc()}
        alt={alt}
        className={`${currentSizeClass} w-auto object-contain transition`}
        onError={() => setImgError(true)}
      />
      {showBadge && badgeText && (
        <span className="hidden sm:inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
          {badgeText}
        </span>
      )}
    </div>
  );
};
