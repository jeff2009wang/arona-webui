import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ToolCall } from '../../types';

const STATE_CONFIG = {
  running: {
    label: 'TOOL CALL',
    accentColor: 'var(--primary)',
    bgAlpha: 'rgba(31,168,255,0.06)',
    borderAlpha: 'rgba(31,168,255,0.22)',
  },
  success: {
    label: 'TOOL RESULT',
    accentColor: '#22c55e',
    bgAlpha: 'rgba(74,222,128,0.05)',
    borderAlpha: 'rgba(74,222,128,0.20)',
  },
  error: {
    label: 'TOOL ERROR',
    accentColor: '#f87171',
    bgAlpha: 'rgba(248,113,113,0.06)',
    borderAlpha: 'rgba(248,113,113,0.20)',
  },
} as const;

interface ToolCardProps {
  toolCall: ToolCall;
}

export function ToolCard({ toolCall }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATE_CONFIG[toolCall.status];
  const isRunning = toolCall.status === 'running';
  const isError = toolCall.status === 'error';

  const resultText =
    toolCall.result !== undefined
      ? typeof toolCall.result === 'string'
        ? toolCall.result
        : JSON.stringify(toolCall.result, null, 2)
      : '';

  const argsText =
    toolCall.arguments && Object.keys(toolCall.arguments).length > 0
      ? JSON.stringify(toolCall.arguments, null, 2)
      : '';

  const resultPreview =
    typeof toolCall.result === 'string' && toolCall.result
      ? toolCall.result
      : '';

  const argsPreview = argsText ? argsText : '';

  const collapsedPreview = resultPreview || argsPreview;

  const hasDetails = Boolean(resultText || argsText);

  return (
    <div
      className={`max-w-[78%] ${isError ? 'tool-shake' : ''}`}
      style={{
        background: cfg.bgAlpha,
        border: `1px solid ${cfg.borderAlpha}`,
        borderLeft: `3px solid ${cfg.accentColor}`,
        borderRadius: 16,
        backdropFilter: 'blur(8px)',
        overflow: 'hidden',
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{ borderBottom: `1px solid ${cfg.borderAlpha}` }}
      >
        <div className="flex items-center gap-2">
          {isRunning ? (
            <span
              role="status"
              aria-label="Loading"
              className="tool-sweep"
              style={{
                display: 'inline-block', width: 10, height: 10,
                borderRadius: '50%',
                border: `1.5px solid rgba(31,168,255,0.2)`,
                borderTopColor: 'var(--primary)',
                animation: 'spin 0.7s linear infinite',
              }}
            />
          ) : toolCall.status === 'success' ? (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ fontSize: 11, fontWeight: 800, color: cfg.accentColor }}
            >
              ✓
            </motion.span>
          ) : (
            <span style={{ fontSize: 11, fontWeight: 800, color: cfg.accentColor }}>
              ✗
            </span>
          )}
          <span
            className="font-black uppercase tracking-wider"
            style={{ fontSize: 8, color: cfg.accentColor }}
          >
            {cfg.label}
          </span>
        </div>

        <span
          className="flex items-center gap-1 font-bold px-2 py-0.5 rounded-full"
          style={{
            fontSize: 8,
            background: cfg.bgAlpha,
            border: `1px solid ${cfg.borderAlpha}`,
            color: cfg.accentColor,
          }}
        >
          {isRunning && (
            <span
              aria-hidden="true"
              style={{
                width: 4, height: 4, borderRadius: '50%',
                background: cfg.accentColor,
                animation: 'pulse 1s ease-in-out infinite',
              }}
            />
          )}
          {isRunning ? 'Running' : toolCall.status === 'success' ? `Done` : 'Failed'}
        </span>
      </div>

      {/* Body */}
      <div className="px-3 py-2">
        <div className="font-bold" style={{ fontSize: 12, color: 'var(--text-main)' }}>
          {toolCall.name}
        </div>

        {!expanded && collapsedPreview && (
          <div
            className="mt-1"
            style={{
              fontSize: 10,
              color: isError ? '#dc2626' : isRunning ? 'var(--text-sub)' : '#16a34a',
            }}
          >
            {collapsedPreview.length > 80
              ? collapsedPreview.slice(0, 80) + '…'
              : collapsedPreview}
          </div>
        )}

        {/* Expanded code block */}
        <AnimatePresence>
          {expanded && hasDetails && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 8 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: 'hidden' }}
            >
              {argsText && (
                <pre
                  style={{
                    fontFamily: "'SF Mono', 'Menlo', monospace",
                    fontSize: 10, lineHeight: 1.55,
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid var(--line-soft)',
                    borderRadius: 10,
                    padding: '8px 10px',
                    overflowX: 'auto',
                    color: 'var(--text-sub)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: '0 0 8px',
                  }}
                >
                  {argsText}
                </pre>
              )}
              {resultText && (
                <pre
                  style={{
                    fontFamily: "'SF Mono', 'Menlo', monospace",
                    fontSize: 10, lineHeight: 1.55,
                    background: 'rgba(255,255,255,0.5)',
                    border: '1px solid var(--line-soft)',
                    borderRadius: 10,
                    padding: '8px 10px',
                    overflowX: 'auto',
                    color: toolCall.status === 'error' ? '#dc2626' : 'var(--text-sub)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    margin: 0,
                  }}
                >
                  {resultText}
                </pre>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer toggle */}
      {hasDetails && (
        <div className="px-3 pb-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:rounded focus-visible:outline-none"
            style={{ fontSize: 9, color: 'var(--text-muted)' }}
          >
            {expanded ? '▲ 收起' : '▼ 展开详情'}
          </button>
        </div>
      )}
    </div>
  );
}
