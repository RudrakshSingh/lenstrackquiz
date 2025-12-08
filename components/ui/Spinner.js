import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function Spinner({ size = 'md', className }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
      <div className="relative inline-flex items-center justify-center">
      <Loader2
        className={clsx('animate-spin text-black', sizes[size], className)}
        aria-label="Loading"
      />
      <div className={clsx('absolute inset-0 rounded-full border-2 border-gray-200 dark:border-gray-800 animate-pulse', sizes[size])}></div>
    </div>
  );
}

// Full-page loader component
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black relative overflow-hidden">
      <div className="absolute inset-0 gradient-mesh opacity-20"></div>
      <div className="text-center animate-fly-in relative z-10">
        <div className="relative inline-block">
          <Loader2 className="w-16 h-16 animate-spin text-black dark:text-white mx-auto mb-6 drop-shadow-2xl" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-gray-200 dark:border-gray-800 rounded-full mx-auto animate-pulse-slow"></div>
          <div className="absolute inset-0 w-16 h-16 border-2 border-black/20 dark:border-white/20 rounded-full mx-auto animate-ping"></div>
        </div>
        <p className="text-black animate-pulse-slow font-semibold text-lg">Loading...</p>
      </div>
    </div>
  );
}

