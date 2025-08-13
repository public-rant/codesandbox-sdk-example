'use client';

interface LoadingSpinnerProps {
  /**
   * The text to display below the spinner
   * @default "Loading..."
   */
  text?: string;
  /**
   * The size of the spinner
   * @default "md"
   */
  size?: 'sm' | 'md' | 'lg';
  /**
   * Whether to show the component in full screen mode
   * @default true
   */
  fullScreen?: boolean;
  /**
   * Additional CSS classes to apply to the container
   */
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16'
} as const;

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-xl'
} as const;

export default function LoadingSpinner({
  text = 'Loading...',
  size = 'md',
  fullScreen = true,
  className = ''
}: LoadingSpinnerProps) {
  const containerClasses = fullScreen
    ? 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center'
    : 'flex items-center justify-center';

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="text-center">
        <div
          className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-indigo-600 mx-auto mb-4`}
          role="status"
          aria-label="Loading"
        />
        <p className={`text-gray-600 ${textSizeClasses[size]}`}>{text}</p>
      </div>
    </div>
  );
}
