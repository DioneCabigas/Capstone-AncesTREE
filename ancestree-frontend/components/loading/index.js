/**
 * Loading Components Index
 * 
 * Centralized exports for all loading-related components.
 * Import any loading component from this single location.
 * 
 * Usage Examples:
 * 
 * // Basic loading spinner
 * import { LoadingSpinner } from '@/components/loading';
 * <LoadingSpinner size="lg" message="Loading..." />
 * 
 * // Full screen loading
 * import { LoadingScreen } from '@/components/loading';
 * <LoadingScreen variant="branded" message="Welcome to AncesTREE" />
 * 
 * // Page transitions
 * import { PageTransition, usePageTransition } from '@/components/loading';
 * const { isTransitioning, startTransition } = usePageTransition();
 * 
 * // Content skeleton loaders
 * import { ContentLoader, CardLoader, ProfileLoader } from '@/components/loading';
 * <ContentLoader type="profile" />
 * <CardLoader showImage={false} />
 * <ProfileLoader showStats={true} />
 */

// Import all components
import LoadingSpinner from '../LoadingSpinner';
import LoadingScreen from '../LoadingScreen';
import PageTransition, { usePageTransition, PageTransitionProvider } from '../PageTransition';
import ContentLoaderMain, { 
  ContentLoader,
  CardLoader,
  ListLoader,
  ListItemLoader,
  ProfileLoader,
  TableLoader,
  TreeLoader,
  TreeNodeLoader,
  FormLoader,
  StatsLoader
} from '../ContentLoader';

// Re-export all components
export {
  // Main loading components
  LoadingSpinner,
  LoadingScreen,
  PageTransition,
  
  // Page transition utilities
  usePageTransition,
  PageTransitionProvider,
  
  // Content loaders
  ContentLoaderMain as ContentLoader,
  ContentLoader as GenericContentLoader,
  CardLoader,
  ListLoader,
  ListItemLoader,
  ProfileLoader,
  TableLoader,
  TreeLoader,
  TreeNodeLoader,
  FormLoader,
  StatsLoader
};

// Default export - most commonly used component
export default LoadingSpinner;

/**
 * Component Selection Guide:
 * 
 * 1. LoadingSpinner
 *    - Use for: Small loading indicators, button loading states, inline loading
 *    - Sizes: 'sm', 'md', 'lg', 'xl'
 *    - Can be full screen or inline
 * 
 * 2. LoadingScreen
 *    - Use for: App initialization, authentication, major page loads
 *    - Variants: 'default', 'minimal', 'branded'
 *    - Full screen with progress tracking
 * 
 * 3. PageTransition
 *    - Use for: Smooth transitions between routes
 *    - Variants: 'fade', 'slide', 'scale', 'blur'
 *    - Works with navigation libraries
 * 
 * 4. Content Loaders (Skeletons)
 *    - CardLoader: For card layouts
 *    - ListLoader: For list views
 *    - ProfileLoader: For user profiles
 *    - TableLoader: For data tables
 *    - TreeLoader: For family trees
 *    - FormLoader: For forms
 *    - StatsLoader: For dashboard stats
 * 
 * Performance Tips:
 * - Use skeleton loaders for better perceived performance
 * - Keep loading durations under 3 seconds when possible
 * - Provide progress indicators for long operations
 * - Use appropriate loading types for different content
 */