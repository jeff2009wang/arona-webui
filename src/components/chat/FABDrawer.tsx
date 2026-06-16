import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Trash2, Square } from 'lucide-react';
import { useSessionStore } from '../../stores/sessionStore';
import { useUIStore } from '../../stores/uiStore';
import { useLLM } from '../../hooks/useLLM';

interface SubBtn {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export function FABDrawer() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const isStreaming = useSessionStore((s) => s.isStreaming);
  const clearChat = useSessionStore((s) => s.clearChat);
  const openSettings = useUIStore((s) => s.openSettings);
  const { stop } = useLLM();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const subButtons: SubBtn[] = [
    {
      icon: <Square size={13} />,
      label: 'Stop',
      onClick: () => { stop(); setOpen(false); },
      disabled: !isStreaming,
    },
    {
      icon: <Trash2 size={13} />,
      label: 'Clear',
      onClick: () => { clearChat(); setOpen(false); },
      danger: true,
    },
    {
      icon: <Settings size={13} />,
      label: 'Settings',
      onClick: () => { openSettings(); setOpen(false); },
    },
  ];

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9,
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(2px)',
            }}
          />
        )}
      </AnimatePresence>

      <div
        ref={ref}
        style={{ position: 'absolute', bottom: 62, right: 12, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
      >
        <AnimatePresence>
          {open && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={{
                hidden: {},
                visible: {
                  transition: {
                    staggerChildren: 0.05,
                    delayChildren: 0.02,
                  },
                },
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
            >
              {subButtons.map((btn) => (
                <motion.button
                  key={btn.label}
                  aria-label={btn.label}
                  onClick={btn.onClick}
                  disabled={btn.disabled}
                  variants={{
                    hidden: { opacity: 0, y: 8, scale: 0.85 },
                    visible: { opacity: 1, y: 0, scale: 1 },
                  }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  whileHover={{ scale: 1.08, y: -1 }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--card)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: `1px solid ${btn.danger ? 'rgba(248,113,113,0.4)' : 'var(--line)'}`,
                    color: btn.danger ? '#f87171' : 'var(--text-sub)',
                    display: 'grid', placeItems: 'center',
                    boxShadow: '0 2px 12px var(--shadow)',
                    cursor: btn.disabled ? 'not-allowed' : 'pointer',
                    opacity: btn.disabled ? 0.4 : 1,
                  }}
                >
                  {btn.icon}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          aria-label="Tools menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.94 }}
          style={{
            width: 42, height: 42, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
            color: 'white',
            display: 'grid', placeItems: 'center',
            boxShadow: `0 4px 20px var(--shadow), 0 0 16px rgba(31,168,255,0.18)`,
            border: 'none',
            cursor: 'pointer',
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            fontSize: 18,
          }}
        >
          ☰
        </motion.button>
      </div>
    </>
  );
}
