import { Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  onClick,
  type = 'button',
  children,
  className,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent transform hover:scale-105 active:scale-95';
  
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
    outline: 'border-2 border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
  };

  const sizes = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-10 px-4 text-sm',
    lg: 'h-12 px-6 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        'cursor-pointer',
        className
      )}
      style={{
        minWidth: size === 'sm' ? 'auto' : '80px',
      }}
      {...props}
    >
      {loading && (
        <Loader2 className={clsx('animate-spin', iconPosition === 'right' ? 'ml-2' : 'mr-2', size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4')} />
      )}
      {!loading && icon && iconPosition === 'left' && (
        <span className="mr-2">{icon}</span>
      )}
      {children}
      {!loading && icon && iconPosition === 'right' && (
        <span className="ml-2">{icon}</span>
      )}
    </button>
  );
}

