import Button from './Button';
import clsx from 'clsx';

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}) {
  return (
    <div className={clsx('text-center py-12 sm:py-16 animate-fly-in', className)}>
      {icon && (
        <div className="flex justify-center mb-6 animate-float">
          <div className="text-gray-400">
            {icon}
          </div>
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-semibold text-black mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-black mb-6 max-w-md mx-auto px-4">
          {description}
        </p>
      )}
      {action && (
        <div className="animate-pop-in animate-delay-400">
          <Button onClick={action.onClick} variant="primary">
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

