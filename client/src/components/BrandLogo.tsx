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
      <div className={`relative ${iconSizeClasses[size]} flex-shrink-0 flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 p-2 shadow-lg shadow-blue-500/20`}>
        {/* Custom wave curve */}
        <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 13c3-4 6-4 9 0s6 4 9 0" />
          <path d="M4 17c3-3 5-3 8 0s5 3 8 0" opacity="0.6" strokeWidth="2" />
        </svg>
      </div>
      <div>
        <span className={`tracking-tight text-white dark:text-white font-sans ${textClasses[size]}`}>
          Bluewave <span className="text-cyan-400">Chat</span>
        </span>
        {showTagline && (
          <p className="text-xs text-blue-200/70 font-medium">Connect. Chat. Be Closer.</p>
        )}
      </div>
    </div>
  );
};
