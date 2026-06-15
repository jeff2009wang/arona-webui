import { useState, useEffect, useRef } from 'react';
import { Settings, Trash2, Upload, Square } from 'lucide-react';
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
  const currentSessionId = useSessionStore((s) => s.currentSessionId);
  const clearSession = useSessionStore((s) => s.clearSession);
  const exportToFile = useSessionStore((s) => s.exportToFile);
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
      onClick: () => { if (currentSessionId) clearSession(currentSessionId); setOpen(false); },
      danger: true,
    },
    {
      icon: <Upload size={13} />,
      label: 'Export',
      onClick: () => { exportToFile(); setOpen(false); },
    },
    {
      icon: <Settings size={13} />,
      label: 'Settings',
      onClick: () => { openSettings(); setOpen(false); },
    },
  ];

  return (
    <div
      ref={ref}
      style={{ position: 'absolute', bottom: 62, right: 12, zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}
    >
      {/* Sub-buttons (only in DOM when open) */}
      {open && subButtons.map((btn, i) => (
        <button
          key={btn.label}
          aria-label={btn.label}
          onClick={btn.onClick}
          disabled={btn.disabled}
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
            animation: `fabIn 0.15s cubic-bezier(.34,1.56,.64,1) ${i * 40}ms both`,
          }}
        >
          {btn.icon}
        </button>
      ))}

      {/* Main FAB */}
      <button
        aria-label="Tools menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
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
      </button>

      <style>{`
        @keyframes fabIn {
          from { opacity: 0; transform: translateY(8px) scale(0.85); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
