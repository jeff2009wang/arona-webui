import { useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'primary';
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'primary',
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Auto-focus confirm button when open
  useEffect(() => {
    if (isOpen) {
      const id = requestAnimationFrame(() => {
        confirmRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isOpen]);

  // ESC key closes
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  const confirmBg =
    variant === 'danger'
      ? 'rgba(248,113,113,0.10)'
      : 'linear-gradient(135deg, var(--primary-light), var(--primary))';
  const confirmColor = variant === 'danger' ? 'var(--danger)' : 'white';
  const confirmBorder =
    variant === 'danger' ? '1px solid rgba(248,113,113,0.35)' : 'none';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
          aria-describedby="confirm-message"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
        >
          <motion.div
            className="w-full max-w-[360px] flex flex-col overflow-hidden"
            style={{
              background: 'var(--card)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--line)',
              borderRadius: 20,
              boxShadow: '0 24px 80px var(--shadow)',
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <div
              className="px-5 py-4"
              style={{ borderBottom: '1px solid var(--line-soft)' }}
            >
              <h2
                id="confirm-title"
                className="text-[13px] font-black"
                style={{ color: 'var(--text-main)' }}
              >
                {title}
              </h2>
            </div>

            {/* Body */}
            <div className="px-5 py-4">
              <p
                id="confirm-message"
                className="text-[11px] leading-relaxed"
                style={{ color: 'var(--text-sub)' }}
              >
                {message}
              </p>
            </div>

            {/* Footer */}
            <div
              className="flex items-center justify-end gap-2 px-5 py-4"
              style={{ borderTop: '1px solid var(--line-soft)' }}
            >
              <button
                onClick={onCancel}
                className="px-4 py-2 rounded-xl text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
                style={{
                  background: 'var(--tool-bg)',
                  border: '1px solid var(--line)',
                  color: 'var(--text-sub)',
                }}
              >
                {cancelText}
              </button>
              <button
                ref={confirmRef}
                onClick={onConfirm}
                className="px-4 py-2 rounded-xl text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
                style={{
                  background: confirmBg,
                  border: confirmBorder,
                  color: confirmColor,
                }}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
