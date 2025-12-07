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
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-danger ml-1">*</span>}
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
            'block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary appearance-none bg-white',
            error && 'border-danger focus:border-danger focus:ring-danger',
            disabled && 'bg-gray-100 cursor-not-allowed',
            'px-3 py-2 pr-10 text-sm',
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
          <ChevronDown className="h-5 w-5 text-gray-400" />
        </div>
        {error && (
          <div className="absolute inset-y-0 right-8 flex items-center pointer-events-none">
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

