import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check, RefreshCw } from 'lucide-react';
import type { Message } from '../../types';

interface MessageActionsProps {
  message: Message;
  onCopy?: (text: string) => void;
  onRegenerate?: () => void;
}

export function MessageActions({ message, onCopy, onRegenerate }: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const isAi = message.role === 'assistant' || message.role === 'tool';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      onCopy?.(message.content);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: silently ignore
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="flex items-center gap-1"
      style={{
        position: 'absolute',
        top: -10,
        right: 0,
        zIndex: 10,
      }}
    >
      <div
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-lg"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line-soft)',
          boxShadow: '0 2px 8px var(--shadow)',
          backdropFilter: 'blur(8px)',
        }}
      >
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy message'}
          className="flex items-center justify-center w-6 h-6 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          style={{ color: copied ? 'var(--status-ok)' : 'var(--text-muted)' }}
          title={copied ? 'Copied!' : 'Copy'}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Check size={13} strokeWidth={2.5} />
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Copy size={13} strokeWidth={2} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {isAi && onRegenerate && (
          <button
            onClick={onRegenerate}
            aria-label="Regenerate response"
            className="flex items-center justify-center w-6 h-6 rounded-md transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            style={{ color: 'var(--text-muted)' }}
            title="Regenerate"
          >
            <RefreshCw size={13} strokeWidth={2} />
          </button>
        )}
      </div>
    </motion.div>
  );
}
