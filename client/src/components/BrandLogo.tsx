import React from 'react';

interface BrandLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ size = 'md', showTagline = false }) => {
  const iconSizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
  };

  const textClasses = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-2xl font-extrabold',
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`relative ${iconSizeClasses[size]} flex-shrink-0 flex items-center justify-center rounded-2xl overflow-hidden shadow-lg shadow-blue-500/20 bg-blue-950/40 p-1`}>
        <img src="/chart-logo.png" alt="Chart" className="w-full h-full object-contain" />
      </div>
      <div>
        <span className={`tracking-tight text-white dark:text-white font-sans ${textClasses[size]}`}>
          Chart
        </span>
        {showTagline && (
          <p className="text-xs text-blue-200/70 font-medium">Connect. Chat. Be Closer.</p>
        )}
      </div>
    </div>
  );
};
