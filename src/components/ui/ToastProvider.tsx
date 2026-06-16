import { useState, useCallback, useRef, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  X,
} from 'lucide-react';
import { ToastContext } from './ToastContext';
import type { Toast, ToastType } from './ToastContext';

export type { Toast, ToastType };

const AUTO_DISMISS_MS = 3000;

const ICON_MAP: Record<ToastType, React.ElementType> = {
  info: Info,
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
};

const ACCENT_VAR: Record<ToastType, string> = {
  info: 'var(--primary)',
  success: 'var(--status-ok)',
  error: 'var(--danger)',
  warning: '#fbbf24',
};

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Record<string, number>>({});

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timersRef.current[id]) {
      window.clearTimeout(timersRef.current[id]);
      delete timersRef.current[id];
    }
  }, []);

  const addToast = useCallback(
    (toast: Omit<Toast, 'id'>): string => {
      const id = generateId();
      const newToast: Toast = { id, ...toast };
      setToasts((prev) => [...prev, newToast]);
      timersRef.current[id] = window.setTimeout(() => {
        removeToast(id);
      }, AUTO_DISMISS_MS);
      return id;
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}

      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="fixed z-[9999] flex flex-col gap-3 top-4 right-4 left-4 sm:left-auto sm:max-w-[min(28rem,calc(100vw-2rem))]"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = ICON_MAP[toast.type];
            const accent = ACCENT_VAR[toast.type];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="pointer-events-auto relative flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-lg backdrop-blur-md"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: accent,
                }}
              >
                <Icon
                  className="mt-0.5 h-5 w-5 shrink-0"
                  style={{ color: accent }}
                  aria-hidden="true"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'var(--text-main)' }}
                  >
                    {toast.title}
                  </p>
                  {toast.message && (
                    <p
                      className="mt-1 text-xs leading-relaxed"
                      style={{ color: 'var(--text-sub)' }}
                    >
                      {toast.message}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 rounded-md p-1 transition-colors hover:bg-[var(--line-soft)]"
                  aria-label="Close notification"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
