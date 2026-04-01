'use client'

/**
 * Reusable Alert/Message component for displaying errors, successes, and warnings
 */
export default function AlertMessage({ 
  message, 
  type = 'error', 
  onClose = null,
  dismissible = false 
}) {
  if (!message) return null;

  const typeStyles = {
    error: 'bg-red-100 border-red-400 text-red-700',
    success: 'bg-green-100 border-green-400 text-green-700',
    warning: 'bg-yellow-100 border-yellow-400 text-yellow-700',
    info: 'bg-blue-100 border-blue-400 text-blue-700',
  };

  return (
    <div 
      className={`border px-4 py-3 rounded relative mb-4 ${typeStyles[type] || typeStyles.error}`}
      role="alert"
    >
      <span className="block sm:inline">{message}</span>
      {dismissible && onClose && (
        <button
          onClick={onClose}
          className="absolute top-0 bottom-0 right-0 px-4 py-3"
          aria-label="Close alert"
        >
          <span className="text-2xl">&times;</span>
        </button>
      )}
    </div>
  );
}
