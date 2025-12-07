import { AlertCircle } from 'lucide-react';
import clsx from 'clsx';

export default function Input({
  label,
  placeholder,
  error,
  hint,
  required = false,
  disabled = false,
  type = 'text',
  icon,
  value,
  onChange,
  className,
  id,
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 11)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-danger ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={errorId || hintId ? [errorId, hintId].filter(Boolean).join(' ') : undefined}
          className={clsx(
            'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary',
            icon && 'pl-10',
            error && 'border-danger focus:border-danger focus:ring-danger',
            disabled && 'bg-gray-100 cursor-not-allowed',
            'px-3 py-2 text-sm',
            className
          )}
          {...props}
        />
        {error && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-danger" />
          </div>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1 text-sm text-gray-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

