'use client'

/**
 * LoadingSpinner Component
 * 
 * A simple loading spinner that displays while authentication status is being checked.
 * This provides visual feedback to users that something is happening in the background.
 * 
 * The component uses Tailwind CSS for styling:
 * - flex, justify-center, items-center: Center the spinner on the screen
 * - h-screen: Make it full height
 * - animate-spin: Apply a spinning animation
 * - border colors use the app's color scheme variables
 */

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center h-screen bg-[var(--dark-green)]">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--light-yellow)]"></div>
    </div>
  );
}