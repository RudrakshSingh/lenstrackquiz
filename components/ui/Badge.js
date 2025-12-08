import clsx from 'clsx';

export default function Badge({
  variant = 'solid',
  color = 'gray',
  size = 'md',
  children,
  className,
  ...props
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-md';
  
  // Special variants
  const specialVariants = {
    success: 'bg-green-100 text-green-800',
    secondary: 'bg-gray-100 text-gray-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-gray-100 text-gray-800',
  };

  // Handle special variant names
  if (variant === 'success' || variant === 'secondary' || variant === 'warning' || variant === 'danger' || variant === 'info') {
    const sizes = {
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
    };
    
    return (
      <span
        className={clsx(
          baseStyles,
          specialVariants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }

  const variants = {
    solid: '',
    outline: 'border-2 bg-transparent',
    soft: 'bg-opacity-10',
  };

  const colors = {
    blue: {
      solid: 'bg-blue-600 text-white',
      outline: 'border border-blue-600 bg-transparent text-blue-600',
      soft: 'bg-blue-50 text-blue-700',
    },
    green: {
      solid: 'bg-green-600 text-white',
      outline: 'border border-green-600 bg-transparent text-green-600',
      soft: 'bg-green-50 text-green-700',
    },
    red: {
      solid: 'bg-red-600 text-white',
      outline: 'border border-red-600 bg-transparent text-red-600',
      soft: 'bg-red-50 text-red-700',
    },
    yellow: {
      solid: 'bg-amber-500 text-white',
      outline: 'border border-amber-500 bg-transparent text-amber-600',
      soft: 'bg-amber-50 text-amber-700',
    },
    gray: {
      solid: 'bg-gray-600 text-white',
      outline: 'border border-gray-600 bg-transparent text-gray-600',
      soft: 'bg-gray-100 text-gray-700',
    },
    purple: {
      solid: 'bg-indigo-600 text-white',
      outline: 'border border-indigo-600 bg-transparent text-indigo-600',
      soft: 'bg-indigo-50 text-indigo-700',
    },
  };

  const sizes = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        baseStyles,
        variants[variant],
        colors[color]?.[variant] || colors.gray[variant],
        sizes[size],
        'shadow-sm hover:shadow-md transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

