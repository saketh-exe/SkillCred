import { useState, useEffect, createContext, useContext, useCallback, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextValue {
  addToast: (message: string, type?: Toast['type']) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => removeToast(toasts[0].id), 4000);
    return () => clearTimeout(timer);
  }, [toasts, removeToast]);

  const icons = { success: <CheckCircle size={16} />, error: <AlertCircle size={16} />, info: <Info size={16} /> };
  const colors = {
    success: 'bg-[var(--success-subtle)] border-[#BBF7D0] text-[var(--success)]',
    error: 'bg-[var(--danger-subtle)] border-[#FECACA] text-[var(--danger)]',
    info: 'bg-[var(--accent-subtle)] border-[#BFDBFE] text-[var(--accent-text)]',
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8, x: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`flex items-center gap-2 px-4 py-3 rounded-[var(--radius-sm)] border text-sm font-medium shadow-[var(--shadow-md)] ${colors[t.type]}`}
            >
              {icons[t.type]}
              <span>{t.message}</span>
              <button onClick={() => removeToast(t.id)} className="ml-2 opacity-60 hover:opacity-100">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
