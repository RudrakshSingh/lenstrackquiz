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
  multiline = false,
  rows = 4,
  ...props
}) {
  const inputId = id || `input-${Math.random().toString(36).slice(2, 11)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const hintId = hint ? `${inputId}-hint` : undefined;

  const baseInputClasses = clsx(
    'block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm transition-colors',
    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
    'bg-white text-black placeholder-gray-400',
    'hover:border-gray-400',
    icon && !multiline && 'pl-12',
    error && 'border-red-400 bg-red-50 text-black placeholder-red-400 focus:ring-red-500 focus:border-red-500',
    disabled && 'opacity-60 cursor-not-allowed bg-gray-100 border-gray-200',
    multiline && 'resize-y min-h-[120px]',
    'overflow-hidden text-ellipsis',
    className
  );

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-black mb-2"
        >
          {label}
          {required && <span className="text-red-500 ml-1.5 font-bold">*</span>}
        </label>
      )}
      <div className="relative">
        {icon && !multiline && (
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            {icon}
          </div>
        )}
        {multiline ? (
          <textarea
            id={inputId}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            rows={rows}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={errorId || hintId ? [errorId, hintId].filter(Boolean).join(' ') : undefined}
            className={baseInputClasses}
            {...props}
          />
        ) : (
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
            className={baseInputClasses}
            {...props}
          />
        )}
        {error && !multiline && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-2 text-xs font-medium text-black flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-gray-400"></span>
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-2 text-xs font-semibold text-red-600 flex items-center gap-2 bg-red-50 px-3 py-2 rounded-lg border border-red-200" role="alert">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

