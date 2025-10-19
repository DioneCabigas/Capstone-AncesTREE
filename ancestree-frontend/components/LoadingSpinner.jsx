'use client'

import Image from 'next/image';

/**
 * LoadingSpinner Component
 * 
 * An enhanced loading spinner with logo and smooth animations.
 * Provides multiple size variants and customizable styling.
 * 
 * Props:
 * - size: 'sm' | 'md' | 'lg' | 'xl' (default: 'md')
 * - fullScreen: boolean (default: false) - whether to take full screen
 * - showLogo: boolean (default: true) - whether to show the logo
 * - message: string (optional) - loading message to display
 * - className: string (optional) - additional CSS classes
 */

const sizeClasses = {
  sm: {
    container: 'h-16',
    spinner: 'h-8 w-8 border-2',
    logo: 'w-6 h-6',
    text: 'text-sm'
  },
  md: {
    container: 'h-24',
    spinner: 'h-12 w-12 border-3',
    logo: 'w-8 h-8',
    text: 'text-base'
  },
  lg: {
    container: 'h-32',
    spinner: 'h-16 w-16 border-4',
    logo: 'w-12 h-12',
    text: 'text-lg'
  },
  xl: {
    container: 'h-40',
    spinner: 'h-20 w-20 border-4',
    logo: 'w-16 h-16',
    text: 'text-xl'
  }
};

export default function LoadingSpinner({ 
  size = 'md', 
  fullScreen = false, 
  showLogo = true, 
  message = null, 
  className = '' 
}) {
  const sizeClass = sizeClasses[size];
  
  const containerClasses = `
    flex flex-col justify-center items-center
    ${fullScreen ? 'h-screen bg-white' : sizeClass.container}
    ${className}
  `;

  return (
    <div className={containerClasses}>
      <div className="relative flex items-center justify-center">
        {/* Outer spinning ring */}
        <div className={`
          animate-spin rounded-full ${sizeClass.spinner}
          border-transparent border-t-[#4F6F52] border-r-[#4F6F52]
          opacity-75
        `}></div>
        
        {/* Inner spinning ring (counter-clockwise) */}
        <div className={`
          absolute animate-spin rounded-full 
          ${size === 'sm' ? 'h-6 w-6 border-2' : 
            size === 'md' ? 'h-9 w-9 border-2' :
            size === 'lg' ? 'h-12 w-12 border-3' : 'h-15 w-15 border-3'}
          border-transparent border-b-[#313131] border-l-[#313131]
          opacity-60
        `} style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        
        {/* Logo in center */}
        {showLogo && (
          <div className={`absolute ${sizeClass.logo} opacity-80 animate-pulse`}>
            <Image 
              src="/images/smallLogo.png" 
              alt="AncesTREE Logo" 
              width={32} 
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>
      
      {/* Loading message */}
      {message && (
        <p className={`mt-4 ${sizeClass.text} text-[#313131] font-medium animate-pulse`}>
          {message}
        </p>
      )}
      
      {/* Loading dots animation */}
      {!message && (
        <div className="flex space-x-1 mt-4">
          <div className="w-2 h-2 bg-[#4F6F52] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#4F6F52] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-[#4F6F52] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      )}
    </div>
  );
}
