'use client'

import Image from 'next/image';
import { useEffect, useState } from 'react';

/**
 * LoadingScreen Component
 * 
 * A full-screen loading component with logo, animations, and optional progress tracking.
 * Perfect for app initialization, authentication checks, or major page transitions.
 * 
 * Props:
 * - message: string (optional) - loading message to display
 * - subMessage: string (optional) - additional loading details
 * - progress: number (optional) - progress percentage (0-100)
 * - showProgress: boolean (default: false) - whether to show progress bar
 * - variant: 'default' | 'minimal' | 'branded' (default: 'default')
 * - onComplete: function (optional) - callback when loading is complete
 * - autoComplete: boolean (default: false) - automatically complete after duration
 * - duration: number (default: 3000) - auto-complete duration in ms
 */

const LoadingScreen = ({
  message = "Loading AncesTREE...",
  subMessage = "",
  progress = 0,
  showProgress = false,
  variant = 'default',
  onComplete = null,
  autoComplete = false,
  duration = 3000
}) => {
  const [currentProgress, setCurrentProgress] = useState(0);
  const [dots, setDots] = useState('');

  // Animate progress bar
  useEffect(() => {
    if (showProgress && progress > currentProgress) {
      const increment = (progress - currentProgress) / 20;
      const timer = setInterval(() => {
        setCurrentProgress(prev => {
          const next = prev + increment;
          if (next >= progress) {
            clearInterval(timer);
            return progress;
          }
          return next;
        });
      }, 50);
      return () => clearInterval(timer);
    }
  }, [progress, currentProgress, showProgress]);

  // Animate loading dots
  useEffect(() => {
    const timer = setInterval(() => {
      setDots(prev => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);
    return () => clearInterval(timer);
  }, []);

  // Auto-complete functionality
  useEffect(() => {
    if (autoComplete && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoComplete, onComplete, duration]);

  if (variant === 'minimal') {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-95 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-transparent border-t-[#4F6F52] border-r-[#4F6F52]"></div>
            <div className="absolute inset-0 animate-spin rounded-full h-12 w-12 border-4 border-transparent border-b-[#313131] border-l-[#313131] opacity-60" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          {message && (
            <p className="mt-4 text-sm text-[#313131] font-medium">{message}</p>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'branded') {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-[#4F6F52] to-[#313131] z-50 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="relative mb-8">
            <Image 
              src="/images/AncesTree_Logo.png" 
              alt="AncesTREE Logo" 
              width={200} 
              height={60}
              className="animate-pulse"
            />
          </div>
          <div className="flex space-x-2 justify-center mb-6">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
          <p className="text-lg font-medium mb-2">{message}</p>
          {subMessage && (
            <p className="text-sm opacity-80">{subMessage}</p>
          )}
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-6">
        {/* Logo */}
        <div className="mb-8">
          <Image 
            src="/images/AncesTree_Logo.png" 
            alt="AncesTREE Logo" 
            width={180} 
            height={54}
            className="mx-auto"
          />
        </div>

        {/* Main Spinner */}
        <div className="relative flex items-center justify-center mb-8">
          {/* Outer ring */}
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-[#4F6F52] border-r-[#4F6F52] opacity-75"></div>
          
          {/* Inner ring */}
          <div className="absolute animate-spin rounded-full h-12 w-12 border-3 border-transparent border-b-[#313131] border-l-[#313131] opacity-60" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          
          {/* Center dot */}
          <div className="absolute w-3 h-3 bg-[#4F6F52] rounded-full animate-pulse"></div>
        </div>

        {/* Loading Message */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-[#313131] mb-2">
            {message}{dots}
          </h2>
          {subMessage && (
            <p className="text-sm text-gray-600">{subMessage}</p>
          )}
        </div>

        {/* Progress Bar */}
        {showProgress && (
          <div className="mb-6">
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-[#4F6F52] h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${currentProgress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{Math.round(currentProgress)}% complete</p>
          </div>
        )}

        {/* Decorative Elements */}
        <div className="flex justify-center space-x-1">
          <div className="w-2 h-2 bg-[#4F6F52] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#4F6F52] rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
          <div className="w-2 h-2 bg-[#4F6F52] rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
        </div>

        {/* Subtle background animation */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#4F6F52] opacity-5 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-[#313131] opacity-5 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;