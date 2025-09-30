'use client'

/**
 * ContentLoader Components
 * 
 * A collection of skeleton loading components for different content types.
 * Provides smooth loading states while content is being fetched.
 * 
 * Available components:
 * - ContentLoader: Generic skeleton loader
 * - CardLoader: Loading state for card components
 * - ListLoader: Loading state for list items
 * - ProfileLoader: Loading state for user profiles
 * - TableLoader: Loading state for tables
 * - TreeLoader: Loading state for family tree components
 */

// Base skeleton element with animation
const SkeletonElement = ({ className = "", animate = true }) => {
  const baseClasses = "bg-gray-200 rounded";
  const animationClasses = animate ? "animate-pulse" : "";
  
  return (
    <div className={`${baseClasses} ${animationClasses} ${className}`}></div>
  );
};

// Generic content loader
export const ContentLoader = ({ 
  lines = 3, 
  className = "", 
  animate = true,
  spacing = "mb-3"
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <SkeletonElement
          key={index}
          className={`h-4 ${spacing} ${
            index === 0 ? 'w-3/4' : 
            index === lines - 1 ? 'w-1/2' : 
            'w-full'
          }`}
          animate={animate}
        />
      ))}
    </div>
  );
};

// Card loader component
export const CardLoader = ({ 
  showImage = true, 
  showTitle = true, 
  showContent = true,
  className = "",
  animate = true 
}) => {
  return (
    <div className={`border rounded-lg p-4 space-y-4 bg-white ${className}`}>
      {showImage && (
        <SkeletonElement className="h-48 w-full" animate={animate} />
      )}
      {showTitle && (
        <SkeletonElement className="h-6 w-2/3" animate={animate} />
      )}
      {showContent && (
        <div className="space-y-2">
          <SkeletonElement className="h-4 w-full" animate={animate} />
          <SkeletonElement className="h-4 w-5/6" animate={animate} />
          <SkeletonElement className="h-4 w-3/4" animate={animate} />
        </div>
      )}
    </div>
  );
};

// List item loader
export const ListItemLoader = ({ 
  showAvatar = true, 
  showActions = false,
  className = "",
  animate = true 
}) => {
  return (
    <div className={`flex items-center space-x-4 p-3 ${className}`}>
      {showAvatar && (
        <SkeletonElement className="h-10 w-10 rounded-full flex-shrink-0" animate={animate} />
      )}
      <div className="flex-1 space-y-2">
        <SkeletonElement className="h-4 w-3/4" animate={animate} />
        <SkeletonElement className="h-3 w-1/2" animate={animate} />
      </div>
      {showActions && (
        <div className="flex space-x-2">
          <SkeletonElement className="h-8 w-16" animate={animate} />
          <SkeletonElement className="h-8 w-16" animate={animate} />
        </div>
      )}
    </div>
  );
};

// List loader component
export const ListLoader = ({ 
  items = 5, 
  showAvatar = true, 
  showActions = false,
  className = "",
  animate = true 
}) => {
  return (
    <div className={`divide-y divide-gray-200 ${className}`}>
      {Array.from({ length: items }).map((_, index) => (
        <ListItemLoader 
          key={index}
          showAvatar={showAvatar}
          showActions={showActions}
          animate={animate}
        />
      ))}
    </div>
  );
};

// Profile loader component
export const ProfileLoader = ({ 
  showCover = true,
  showStats = true,
  className = "",
  animate = true 
}) => {
  return (
    <div className={`bg-white rounded-lg overflow-hidden ${className}`}>
      {showCover && (
        <SkeletonElement className="h-32 w-full rounded-none" animate={animate} />
      )}
      <div className="p-6">
        {/* Profile picture and basic info */}
        <div className="flex items-start space-x-4 mb-6">
          <SkeletonElement className="h-20 w-20 rounded-full flex-shrink-0" animate={animate} />
          <div className="flex-1 space-y-2">
            <SkeletonElement className="h-6 w-3/4" animate={animate} />
            <SkeletonElement className="h-4 w-1/2" animate={animate} />
            <SkeletonElement className="h-4 w-2/3" animate={animate} />
          </div>
        </div>
        
        {/* Stats */}
        {showStats && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="text-center">
                <SkeletonElement className="h-6 w-12 mx-auto mb-1" animate={animate} />
                <SkeletonElement className="h-3 w-16 mx-auto" animate={animate} />
              </div>
            ))}
          </div>
        )}
        
        {/* Bio */}
        <div className="space-y-2">
          <SkeletonElement className="h-4 w-full" animate={animate} />
          <SkeletonElement className="h-4 w-5/6" animate={animate} />
          <SkeletonElement className="h-4 w-3/4" animate={animate} />
        </div>
      </div>
    </div>
  );
};

// Table loader component
export const TableLoader = ({ 
  rows = 5, 
  columns = 4,
  showHeader = true,
  className = "",
  animate = true 
}) => {
  return (
    <div className={`bg-white rounded-lg overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {showHeader && (
            <thead className="bg-gray-50">
              <tr>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-4 py-3">
                    <SkeletonElement className="h-4 w-20" animate={animate} />
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-200">
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: columns }).map((_, colIndex) => (
                  <td key={colIndex} className="px-4 py-3">
                    <SkeletonElement 
                      className={`h-4 ${colIndex === 0 ? 'w-24' : 'w-16'}`} 
                      animate={animate} 
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Tree node loader for family trees
export const TreeNodeLoader = ({ animate = true }) => {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 w-48">
      <div className="text-center space-y-3">
        <SkeletonElement className="h-16 w-16 rounded-full mx-auto" animate={animate} />
        <SkeletonElement className="h-4 w-3/4 mx-auto" animate={animate} />
        <SkeletonElement className="h-3 w-1/2 mx-auto" animate={animate} />
      </div>
    </div>
  );
};

// Family tree loader
export const TreeLoader = ({ 
  generations = 3,
  className = "",
  animate = true 
}) => {
  const nodesPerGeneration = [1, 2, 4]; // Typical family tree structure

  return (
    <div className={`space-y-8 p-8 ${className}`}>
      {Array.from({ length: generations }).map((_, genIndex) => (
        <div key={genIndex} className="flex justify-center space-x-8">
          {Array.from({ length: nodesPerGeneration[genIndex] || 4 }).map((_, nodeIndex) => (
            <TreeNodeLoader key={nodeIndex} animate={animate} />
          ))}
        </div>
      ))}
    </div>
  );
};

// Form loader component
export const FormLoader = ({ 
  fields = 4,
  showButtons = true,
  className = "",
  animate = true 
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <SkeletonElement className="h-4 w-24" animate={animate} />
          <SkeletonElement className="h-10 w-full" animate={animate} />
        </div>
      ))}
      
      {showButtons && (
        <div className="flex space-x-4 pt-4">
          <SkeletonElement className="h-10 w-24" animate={animate} />
          <SkeletonElement className="h-10 w-24" animate={animate} />
        </div>
      )}
    </div>
  );
};

// Dashboard stats loader
export const StatsLoader = ({ 
  stats = 4,
  className = "",
  animate = true 
}) => {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {Array.from({ length: stats }).map((_, index) => (
        <div key={index} className="bg-white rounded-lg p-6 border">
          <div className="flex items-center justify-between">
            <div className="space-y-2 flex-1">
              <SkeletonElement className="h-4 w-20" animate={animate} />
              <SkeletonElement className="h-8 w-16" animate={animate} />
            </div>
            <SkeletonElement className="h-12 w-12 rounded" animate={animate} />
          </div>
        </div>
      ))}
    </div>
  );
};

// Main ContentLoader component (default export)
const ContentLoaderMain = ({ 
  type = 'content',
  className = "",
  animate = true,
  ...props 
}) => {
  const loaders = {
    content: ContentLoader,
    card: CardLoader,
    list: ListLoader,
    profile: ProfileLoader,
    table: TableLoader,
    tree: TreeLoader,
    form: FormLoader,
    stats: StatsLoader
  };

  const LoaderComponent = loaders[type] || ContentLoader;
  
  return (
    <LoaderComponent 
      className={className} 
      animate={animate}
      {...props} 
    />
  );
};

export default ContentLoaderMain;