'use client'

import { useState, useEffect } from 'react';
import Image from 'next/image';

/**
 * PageTransition Component
 * 
 * A smooth page transition overlay that shows during navigation between pages.
 * Provides visual continuity and feedback during route changes.
 * 
 * Props:
 * - isTransitioning: boolean - whether transition is active
 * - direction: 'in' | 'out' | 'both' (default: 'both') - transition direction
 * - duration: number (default: 400) - transition duration in ms
 * - variant: 'slide' | 'fade' | 'scale' | 'blur' (default: 'fade')
 * - showLogo: boolean (default: true) - whether to show logo during transition
 * - message: string (optional) - message to show during transition
 * - className: string (optional) - additional CSS classes
 */

const PageTransition = ({
  isTransitioning,
  direction = 'both',
  duration = 400,
  variant = 'fade',
  showLogo = true,
  message = '',
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [animationPhase, setAnimationPhase] = useState('idle'); // 'idle', 'entering', 'active', 'exiting'

  useEffect(() => {
    if (isTransitioning) {
      setIsVisible(true);
      setAnimationPhase('entering');
      
      // Transition to active phase
      const activeTimer = setTimeout(() => {
        setAnimationPhase('active');
      }, 50);

      return () => clearTimeout(activeTimer);
    } else if (isVisible) {
      setAnimationPhase('exiting');
      
      // Hide after exit animation
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
        setAnimationPhase('idle');
      }, duration);

      return () => clearTimeout(hideTimer);
    }
  }, [isTransitioning, duration, isVisible]);

  if (!isVisible) return null;

  // Variant-specific styles
  const getVariantClasses = () => {
    const base = 'fixed inset-0 z-50 flex items-center justify-center';
    
    switch (variant) {
      case 'slide':
        return `${base} ${
          animationPhase === 'entering' ? 'transform translate-x-full' :
          animationPhase === 'active' ? 'transform translate-x-0' :
          'transform -translate-x-full'
        } transition-transform duration-${duration}`;
      
      case 'scale':
        return `${base} ${
          animationPhase === 'entering' ? 'transform scale-0' :
          animationPhase === 'active' ? 'transform scale-100' :
          'transform scale-0'
        } transition-transform duration-${duration}`;
      
      case 'blur':
        return `${base} ${
          animationPhase === 'entering' ? 'backdrop-blur-0' :
          animationPhase === 'active' ? 'backdrop-blur-sm' :
          'backdrop-blur-0'
        } transition-all duration-${duration}`;
      
      default: // fade
        return `${base} ${
          animationPhase === 'entering' ? 'opacity-0' :
          animationPhase === 'active' ? 'opacity-100' :
          'opacity-0'
        } transition-opacity duration-${duration}`;
    }
  };

  const getBackgroundClasses = () => {
    if (variant === 'blur') {
      return 'bg-white bg-opacity-80';
    }
    return 'bg-white';
  };

  return (
    <div className={`${getVariantClasses()} ${getBackgroundClasses()} ${className}`}>
      <div className="text-center">
        {/* Logo */}
        {showLogo && (
          <div className="mb-4">
            <Image 
              src="/images/smallLogo.png" 
              alt="AncesTREE" 
              width={48} 
              height={48}
              className="mx-auto animate-pulse"
            />
          </div>
        )}

        {/* Loading indicator */}
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-transparent border-t-[#4F6F52] border-r-[#4F6F52] mx-auto"></div>
        </div>

        {/* Message */}
        {message && (
          <p className="mt-3 text-sm text-[#313131] font-medium animate-pulse">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

/**
 * usePageTransition Hook
 * 
 * A custom hook to manage page transitions with Next.js router
 * 
 * Usage:
 * const { isTransitioning, startTransition } = usePageTransition();
 * 
 * // In your navigation handler:
 * const handleNavigation = async (href) => {
 *   await startTransition(() => router.push(href));
 * };
 */
export const usePageTransition = (duration = 400) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  const startTransition = async (navigationFn) => {
    setIsTransitioning(true);
    
    try {
      await navigationFn();
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setTimeout(() => {
        setIsTransitioning(false);
      }, duration);
    }
  };

  return {
    isTransitioning,
    startTransition
  };
};

/**
 * PageTransitionProvider
 * 
 * A provider component that automatically handles page transitions
 * for all route changes in your Next.js app
 * 
 * Wrap your app with this component to enable automatic transitions
 */
export const PageTransitionProvider = ({ 
  children, 
  variant = 'fade',
  duration = 400,
  showLogo = true 
}) => {
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const handleStart = () => setIsTransitioning(true);
    const handleComplete = () => setIsTransitioning(false);

    // Listen for route changes (you might need to adapt this for your routing setup)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleStart);
      window.addEventListener('load', handleComplete);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleStart);
        window.removeEventListener('load', handleComplete);
      }
    };
  }, []);

  return (
    <>
      {children}
      <PageTransition
        isTransitioning={isTransitioning}
        variant={variant}
        duration={duration}
        showLogo={showLogo}
      />
    </>
  );
};

export default PageTransition;