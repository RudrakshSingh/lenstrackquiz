import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type, message, duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 11);
    const toast = { id, type, message };

    setToasts((prev) => [...prev, toast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onRemove }) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function Toast({ toast, onRemove }) {
  const bgColors = {
    success: 'bg-success',
    error: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info',
  };

  const textColors = {
    success: 'text-white',
    error: 'text-white',
    warning: 'text-white',
    info: 'text-white',
  };

  return (
    <div
      className={`${bgColors[toast.type] || 'bg-gray-700'} ${textColors[toast.type] || 'text-white'} px-4 py-3 rounded-md shadow-lg min-w-[300px] max-w-md flex items-center justify-between transition-all duration-300 ease-in-out`}
      role="alert"
      aria-live="polite"
    >
      <span>{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="ml-4 text-white hover:text-gray-200 focus:outline-none"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

