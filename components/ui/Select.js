import { AlertCircle, ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export default function Select({
  label,
  placeholder = 'Select an option',
  error,
  hint,
  required = false,
  disabled = false,
  options = [],
  value,
  onChange,
  className,
  id,
  ...props
}) {
  const selectId = id || `select-${Math.random().toString(36).slice(2, 11)}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const hintId = hint ? `${selectId}-hint` : undefined;

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-black mb-2"
        >
          {label}
          {required && <span className="text-red-600 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          aria-required={required}
          aria-invalid={!!error}
          aria-describedby={clsx(errorId, hintId)}
          className={clsx(
            'block w-full rounded-lg border border-gray-300 px-3 py-2 pr-10 text-sm transition-colors',
            'appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'bg-white text-black',
            'hover:border-gray-400',
            error && 'border-red-500 bg-red-50 text-black focus:ring-red-500',
            disabled && 'opacity-50 cursor-not-allowed bg-gray-100',
            className
          )}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <ChevronDown className="h-5 w-5 text-gray-400 pointer-events-none" />
        </div>
        {error && (
          <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
            <AlertCircle className="h-5 w-5 text-red-600" />
          </div>
        )}
      </div>
      {hint && !error && (
        <p id={hintId} className="mt-1 text-sm text-black">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600 font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

