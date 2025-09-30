# Loading Components Usage Examples

This document provides comprehensive examples of how to use all the enhanced loading components in the AncesTREE application.

## Table of Contents

1. [LoadingSpinner](#loadingspinner)
2. [LoadingScreen](#loadingscreen)
3. [PageTransition](#pagetransition)
4. [Content Loaders](#content-loaders)
5. [Best Practices](#best-practices)

## LoadingSpinner

The enhanced `LoadingSpinner` component provides flexible loading indicators with logo integration.

### Basic Usage

```jsx
import LoadingSpinner from '@/components/LoadingSpinner';

// Small inline spinner
<LoadingSpinner size="sm" showLogo={false} />

// Medium spinner with message
<LoadingSpinner 
  size="md" 
  message="Loading data..." 
  className="my-4"
/>

// Large full-screen spinner
<LoadingSpinner 
  size="lg" 
  fullScreen={true} 
  message="Please wait..." 
/>

// Extra large with custom styling
<LoadingSpinner 
  size="xl" 
  showLogo={true}
  message="Building your family tree..."
  className="bg-gray-50"
/>
```

### Props

- `size`: `'sm' | 'md' | 'lg' | 'xl'` (default: `'md'`)
- `fullScreen`: `boolean` (default: `false`)
- `showLogo`: `boolean` (default: `true`)
- `message`: `string` (optional)
- `className`: `string` (optional)

## LoadingScreen

Full-screen loading component perfect for app initialization and major operations.

### Basic Usage

```jsx
import LoadingScreen from '@/components/LoadingScreen';

// Default loading screen
<LoadingScreen />

// Branded loading with custom message
<LoadingScreen 
  variant="branded"
  message="Welcome to AncesTREE"
  subMessage="Loading your family history..."
/>

// Minimal loading overlay
<LoadingScreen 
  variant="minimal"
  message="Saving changes..."
/>

// Loading with progress bar
<LoadingScreen 
  showProgress={true}
  progress={65}
  message="Uploading photos..."
  subMessage="Please don't close this window"
/>

// Auto-completing loading screen
<LoadingScreen 
  autoComplete={true}
  duration={2000}
  onComplete={() => console.log('Loading complete!')}
  message="Initializing application..."
/>
```

### Props

- `message`: `string` (default: `"Loading AncesTREE..."`)
- `subMessage`: `string` (optional)
- `progress`: `number` (0-100, optional)
- `showProgress`: `boolean` (default: `false`)
- `variant`: `'default' | 'minimal' | 'branded'` (default: `'default'`)
- `onComplete`: `function` (optional)
- `autoComplete`: `boolean` (default: `false`)
- `duration`: `number` (default: `3000`)

## PageTransition

Smooth transitions between pages with multiple animation variants.

### Basic Usage

```jsx
import PageTransition, { usePageTransition } from '@/components/PageTransition';

// Using the hook for manual transitions
function MyPage() {
  const { isTransitioning, startTransition } = usePageTransition();
  const router = useRouter();

  const handleNavigation = async (href) => {
    await startTransition(() => router.push(href));
  };

  return (
    <div>
      <button onClick={() => handleNavigation('/profile')}>
        Go to Profile
      </button>
      <PageTransition 
        isTransitioning={isTransitioning}
        variant="fade"
        message="Navigating..."
      />
    </div>
  );
}

// Different transition variants
<PageTransition 
  isTransitioning={true}
  variant="slide"    // slide from right
  duration={300}
/>

<PageTransition 
  isTransitioning={true}
  variant="scale"    // scale up/down
  showLogo={true}
/>

<PageTransition 
  isTransitioning={true}
  variant="blur"     // blur effect
  message="Loading page..."
/>
```

### Auto-Transition Provider

```jsx
import { PageTransitionProvider } from '@/components/PageTransition';

// Wrap your app for automatic transitions
function App({ children }) {
  return (
    <PageTransitionProvider
      variant="fade"
      duration={400}
      showLogo={true}
    >
      {children}
    </PageTransitionProvider>
  );
}
```

### Props

- `isTransitioning`: `boolean`
- `direction`: `'in' | 'out' | 'both'` (default: `'both'`)
- `duration`: `number` (default: `400`)
- `variant`: `'slide' | 'fade' | 'scale' | 'blur'` (default: `'fade'`)
- `showLogo`: `boolean` (default: `true`)
- `message`: `string` (optional)

## Content Loaders

Skeleton loading components for different content types.

### CardLoader

```jsx
import { CardLoader } from '@/components/ContentLoader';

// Full card skeleton
<CardLoader />

// Card without image
<CardLoader showImage={false} />

// Multiple cards
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {Array.from({ length: 6 }).map((_, i) => (
    <CardLoader key={i} />
  ))}
</div>
```

### ListLoader

```jsx
import { ListLoader } from '@/components/ContentLoader';

// Basic list
<ListLoader items={5} />

// List with avatars and actions
<ListLoader 
  items={8}
  showAvatar={true}
  showActions={true}
/>

// List without animation (static)
<ListLoader 
  items={3}
  animate={false}
  className="border rounded-lg"
/>
```

### ProfileLoader

```jsx
import { ProfileLoader } from '@/components/ContentLoader';

// Full profile skeleton
<ProfileLoader />

// Profile without cover photo
<ProfileLoader showCover={false} />

// Profile without stats
<ProfileLoader showStats={false} />
```

### TreeLoader

```jsx
import { TreeLoader } from '@/components/ContentLoader';

// Family tree skeleton
<TreeLoader generations={4} />

// Smaller tree
<TreeLoader 
  generations={2}
  className="bg-gray-50 rounded-lg"
/>
```

### TableLoader

```jsx
import { TableLoader } from '@/components/ContentLoader';

// Basic table
<TableLoader />

// Custom table size
<TableLoader 
  rows={8}
  columns={5}
  showHeader={true}
/>

// Table without header
<TableLoader 
  rows={10}
  columns={3}
  showHeader={false}
  className="border"
/>
```

### FormLoader

```jsx
import { FormLoader } from '@/components/ContentLoader';

// Form skeleton
<FormLoader />

// Custom form
<FormLoader 
  fields={6}
  showButtons={true}
  className="max-w-md"
/>

// Form without buttons
<FormLoader 
  fields={4}
  showButtons={false}
/>
```

### StatsLoader

```jsx
import { StatsLoader } from '@/components/ContentLoader';

// Dashboard stats
<StatsLoader />

// Custom number of stats
<StatsLoader 
  stats={6}
  className="mb-8"
/>
```

## Generic ContentLoader

```jsx
import ContentLoader from '@/components/ContentLoader';

// Dynamic loader based on type
<ContentLoader type="profile" />
<ContentLoader type="card" showImage={false} />
<ContentLoader type="list" items={3} />
<ContentLoader type="table" rows={5} columns={3} />
<ContentLoader type="tree" generations={3} />
<ContentLoader type="form" fields={5} />
<ContentLoader type="stats" stats={4} />
```

## Real-World Examples

### Authentication Flow

```jsx
// In AuthController
import LoadingScreen from '@/components/LoadingScreen';

if (isLoading) {
  return (
    <LoadingScreen 
      message="Authenticating..." 
      subMessage="Please wait while we verify your credentials"
      variant="default"
    />
  );
}
```

### Data Fetching with Skeleton

```jsx
// In a component that fetches user profiles
import { ProfileLoader } from '@/components/ContentLoader';
import LoadingSpinner from '@/components/LoadingSpinner';

function ProfileList() {
  const [profiles, setProfiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProfiles().then(data => {
      setProfiles(data);
      setIsLoading(false);
    });
  }, []);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProfileLoader key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {profiles.map(profile => (
        <ProfileCard key={profile.id} profile={profile} />
      ))}
    </div>
  );
}
```

### Button Loading State

```jsx
// Button with loading state
function SaveButton() {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveData();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button 
      onClick={handleSave}
      disabled={isSaving}
      className="btn-primary flex items-center space-x-2"
    >
      {isSaving && (
        <LoadingSpinner 
          size="sm" 
          showLogo={false}
          className="!h-4 !w-4"
        />
      )}
      <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
    </button>
  );
}
```

## Best Practices

### 1. Choose the Right Component

- **LoadingSpinner**: For small, inline loading states
- **LoadingScreen**: For full-page loading (authentication, app init)
- **PageTransition**: For navigation between pages
- **Content Loaders**: For specific content types while data loads

### 2. Loading States Hierarchy

```
App Level (Authentication)     → LoadingScreen
Page Level (Navigation)        → PageTransition  
Section Level (Data Fetching)  → Content Loaders
Component Level (Actions)      → LoadingSpinner
```

### 3. Performance Tips

- Use skeleton loaders for better perceived performance
- Keep loading durations under 3 seconds when possible
- Provide progress indicators for operations over 5 seconds
- Use appropriate loading types for different content

### 4. Accessibility

- All loading components include proper ARIA labels
- Screen readers will announce loading states
- Focus management is preserved during transitions

### 5. Customization

- All components accept `className` prop for custom styling
- Use theme colors consistently across components
- Maintain brand identity with logo integration

### 6. Error Handling

```jsx
// Always provide fallbacks
function DataComponent() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData()
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false));
  }, []);

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (isLoading) {
    return <ContentLoader type="card" />;
  }

  return <DataDisplay data={data} />;
}
```

This comprehensive loading system provides a consistent, polished user experience across your entire AncesTREE application!