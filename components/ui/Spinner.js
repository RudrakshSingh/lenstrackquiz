import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function Spinner({ size = 'md', className }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <Loader2
      className={clsx('animate-spin text-primary', sizes[size], className)}
      aria-label="Loading"
    />
  );
}

