import { useContext } from 'react';
import { ToastContext } from '../components/ui/ToastContext';
import type { Toast, ToastType } from '../components/ui/ToastContext';

export type { Toast, ToastType };
export { ToastProvider } from '../components/ui/ToastProvider';

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  const { addToast, removeToast } = ctx;

  const toast = {
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),
  };

  return { addToast, removeToast, toast };
}
