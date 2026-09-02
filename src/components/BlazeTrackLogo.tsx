import React from 'react';

interface BlazeTrackLogoProps {
  variant?: 'emblem' | 'full' | 'horizontal';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  theme?: 'dark' | 'light' | 'auto';
  subtitle?: string;
}

export const BlazeTrackLogo: React.FC<BlazeTrackLogoProps> = ({
  variant = 'full',
  size = 'md',
  className = '',
  theme = 'auto',
  subtitle = 'GESTÃO OPERACIONAL'
}) => {
  const sizeMap = {
    xs: { emblem: 'w-6 h-6', text: 'text-sm', sub: 'text-[8px]', gap: 'gap-1.5' },
    sm: { emblem: 'w-8 h-8', text: 'text-base', sub: 'text-[9px]', gap: 'gap-2' },
    md: { emblem: 'w-10 h-10', text: 'text-xl', sub: 'text-[10px]', gap: 'gap-2.5' },
    lg: { emblem: 'w-16 h-16', text: 'text-2xl', sub: 'text-xs', gap: 'gap-3' },
    xl: { emblem: 'w-24 h-24', text: 'text-4xl', sub: 'text-sm', gap: 'gap-4' },
  };

  const currentSize = sizeMap[size];

  // SVG Emblem matching the uploaded BlazeTrack shield exactly
  const Emblem = ({ className: emblemClass = '' }: { className?: string }) => (
    <svg 
      viewBox="0 0 100 100" 
      className={`${currentSize.emblem} ${emblemClass} shrink-0 drop-shadow-sm`}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Shield Outer Crest */}
      <path 
        d="M 50 9 C 66 9, 83 14, 88 20 C 90 48, 84 76, 50 94 C 16 76, 10 48, 12 20 C 17 14, 34 9, 50 9 Z" 
        fill="none" 
        stroke="#EA382E" 
        strokeWidth="6.5" 
        strokeLinejoin="round" 
        strokeLinecap="round"
      />
      
      {/* Flame Silhouette */}
      <path 
        d="M 50 23 C 46 29, 41 33, 38 39 C 35 44, 38 49, 42 48 C 40 44, 42 39, 45 36 C 46 41, 51 45, 57 44 C 60 38, 58 31, 54 27 C 55 31, 53 35, 50 37 C 51 33, 52 27, 50 23 Z" 
        fill="#EA382E"
      />

      {/* Metric Chart Columns (Left, Center, Right) */}
      <rect 
        x="36" 
        y="65" 
        width="7.5" 
        height="14" 
        rx="1.5" 
        className={theme === 'light' ? 'fill-slate-800' : 'fill-slate-200 dark:fill-slate-300'} 
      />
      <rect 
        x="46.25" 
        y="53" 
        width="7.5" 
        height="26" 
        rx="1.5" 
        className={theme === 'light' ? 'fill-slate-800' : 'fill-slate-200 dark:fill-slate-300'} 
      />
      <rect 
        x="56.5" 
        y="43" 
        width="7.5" 
        height="36" 
        rx="1.5" 
        className={theme === 'light' ? 'fill-slate-800' : 'fill-slate-200 dark:fill-slate-300'} 
      />
    </svg>
  );

  if (variant === 'emblem') {
    return <Emblem className={className} />;
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center ${currentSize.gap} ${className}`}>
        <Emblem />
        <div className="flex flex-col justify-center leading-none">
          <span className={`font-black tracking-wider ${currentSize.text} ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
            BLAZETRACK
          </span>
          {subtitle && (
            <span className={`font-bold tracking-[0.2em] text-orange-400/90 ${currentSize.sub} uppercase mt-0.5`}>
              {subtitle}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center text-center ${currentSize.gap} ${className}`}>
      <Emblem />
      <div className="flex flex-col items-center leading-tight">
        <span className={`font-black tracking-wider ${currentSize.text} ${theme === 'light' ? 'text-slate-900' : 'text-white'}`}>
          BLAZETRACK
        </span>
        {subtitle && (
          <span className={`text-xs text-zinc-400 font-medium mt-1 leading-snug max-w-xs ${theme === 'light' ? 'text-slate-600' : 'text-zinc-400'}`}>
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};
