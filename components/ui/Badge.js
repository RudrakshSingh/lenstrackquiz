import clsx from 'clsx';

export default function Badge({
  variant = 'solid',
  color = 'gray',
  size = 'md',
  children,
  className,
}) {
  const baseStyles = 'inline-flex items-center font-medium rounded-full';

  const variants = {
    solid: '',
    outline: 'border-2 bg-transparent',
    soft: 'bg-opacity-10',
  };

  const colors = {
    blue: {
      solid: 'bg-primary text-white',
      outline: 'border-primary text-primary',
      soft: 'bg-blue-100 text-blue-800',
    },
    green: {
      solid: 'bg-success text-white',
      outline: 'border-success text-success',
      soft: 'bg-green-100 text-green-800',
    },
    red: {
      solid: 'bg-danger text-white',
      outline: 'border-danger text-danger',
      soft: 'bg-red-100 text-red-800',
    },
    yellow: {
      solid: 'bg-warning text-white',
      outline: 'border-warning text-warning',
      soft: 'bg-yellow-100 text-yellow-800',
    },
    gray: {
      solid: 'bg-gray-500 text-white',
      outline: 'border-gray-500 text-gray-700',
      soft: 'bg-gray-100 text-gray-800',
    },
    purple: {
      solid: 'bg-purple-600 text-white',
      outline: 'border-purple-600 text-purple-700',
      soft: 'bg-purple-100 text-purple-800',
    },
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
  };

  return (
    <span
      className={clsx(
        baseStyles,
        variants[variant],
        colors[color]?.[variant] || colors.gray[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}

