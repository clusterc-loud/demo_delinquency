import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast Container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onRemove }) {
  const config = {
    success: {
      bg: 'bg-[#006e2d]',
      icon: <CheckCircle className="w-5 h-5 text-white flex-shrink-0" />,
    },
    error: {
      bg: 'bg-[#ba1a1a]',
      icon: <XCircle className="w-5 h-5 text-white flex-shrink-0" />,
    },
    warning: {
      bg: 'bg-amber-600',
      icon: <AlertTriangle className="w-5 h-5 text-white flex-shrink-0" />,
    },
  };

  const { bg, icon } = config[toast.type] || config.success;

  return (
    <div
      className={`toast-enter pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl text-white ${bg}`}
      style={{ animation: 'slideInRight 0.3s ease-out forwards' }}
    >
      {icon}
      <p className="text-sm font-semibold flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="opacity-70 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
