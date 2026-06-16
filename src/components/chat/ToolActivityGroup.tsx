import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, AlertCircle, Check, Loader2, Sparkles } from 'lucide-react';
import type { ToolCall, Persona } from '../../types';

const TOOL_NAME_MAP: Record<string, string> = {
  web_search: 'Web Search',
  web_extract: 'Page Extract',
  browser_navigate: 'Browser Open',
  browser_console: 'Console Check',
  file_read: 'File Read',
  code_execute: 'Code Run',
};

function getToolDisplayName(name: string): string {
  return TOOL_NAME_MAP[name] ?? name;
}

function formatDuration(startedAt: number, finishedAt?: number): string {
  const end = finishedAt ?? Date.now();
  const ms = Math.max(0, end - startedAt);
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function getGroupStatus(toolCalls: ToolCall[]): 'running' | 'error' | 'success' {
  if (toolCalls.some((tc) => tc.status === 'running')) return 'running';
  if (toolCalls.some((tc) => tc.status === 'error')) return 'error';
  return 'success';
}

function getSummaryText(toolCalls: ToolCall[], status: 'running' | 'error' | 'success'): string {
  const count = toolCalls.length;
  if (status === 'running') return `正在执行 ${count} 个工具调用`;
  if (status === 'error') return `${count} 个工具调用完成，其中有错误`;
  return `已完成 ${count} 个工具调用`;
}

function isEmptyPreview(args: Record<string, unknown>): boolean {
  if (!args || typeof args !== 'object') return true;
  const keys = Object.keys(args);
  if (keys.length === 0) return true;
  if (keys.length === 1 && keys[0] === 'preview' && !args.preview) return true;
  return false;
}

function getPreviewText(toolCall: ToolCall): string {
  const args = toolCall.arguments ?? {};
  if (!isEmptyPreview(args)) {
    const preview = args.preview;
    if (typeof preview === 'string' && preview.trim()) return preview.trim();
  }
  const result = toolCall.result;
  if (result === undefined || result === null) return '';
  if (typeof result === 'string') return result.trim();
  const text = JSON.stringify(result);
  return text === '{}' || text === '[]' ? '' : text;
}

interface ToolActivityGroupProps {
  toolCalls: ToolCall[];
  persona?: Persona;
  isStreaming?: boolean;
}

export function ToolActivityGroup({ toolCalls, persona = 'arona' }: ToolActivityGroupProps) {
  const [expanded, setExpanded] = useState(false);
  const status = getGroupStatus(toolCalls);
  const isRunning = status === 'running';
  const isError = status === 'error';

  const uniqueNames = useMemo(() => {
    const seen = new Set<string>();
    const names: string[] = [];
    for (const tc of toolCalls) {
      const display = getToolDisplayName(tc.name);
      if (!seen.has(display)) {
        seen.add(display);
        names.push(display);
      }
    }
    return names;
  }, [toolCalls]);

  const isPlana = persona === 'plana';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8, x: -12 }}
      animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[min(640px,78%)]"
      style={{
        width: 'max-content',
        maxWidth: 'min(640px, 78%)',
        borderRadius: 18,
        background: isPlana ? 'rgba(30, 45, 68, 0.72)' : 'rgba(255,255,255,0.78)',
        border: `1px solid ${isPlana ? 'rgba(105, 183, 255, 0.22)' : 'rgba(31, 168, 255, 0.22)'}`,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: `0 6px 24px ${isPlana ? 'rgba(0,0,0,0.25)' : 'var(--shadow)'}`,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-inset"
        aria-expanded={expanded}
      >
        <div
          className="flex items-center justify-center shrink-0"
          style={{
            width: 28,
            height: 28,
            borderRadius: 10,
            background: isPlana ? 'rgba(105, 183, 255, 0.14)' : 'rgba(31,168,255,0.10)',
          }}
        >
          {isRunning ? (
            <Loader2 size={14} className="animate-spin" style={{ color: 'var(--primary)' }} />
          ) : isError ? (
            <AlertCircle size={14} style={{ color: 'var(--danger)' }} />
          ) : (
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div
            className="font-semibold"
            style={{
              fontSize: 13,
              color: isPlana ? '#69B7FF' : 'var(--primary)',
              letterSpacing: 0.2,
            }}
          >
            系统活动
          </div>
          <div
            className="truncate"
            style={{
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 1,
            }}
          >
            {getSummaryText(toolCalls, status)}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span
            className="px-2 py-0.5 rounded-full font-medium"
            style={{
              fontSize: 10,
              background: isRunning
                ? isPlana
                  ? 'rgba(105, 183, 255, 0.14)'
                  : 'rgba(31,168,255,0.10)'
                : isError
                  ? 'rgba(248,113,113,0.10)'
                  : isPlana
                    ? 'rgba(74, 222, 128, 0.10)'
                    : 'rgba(74,222,128,0.10)',
              color: isRunning ? 'var(--primary)' : isError ? 'var(--danger)' : '#4ade80',
            }}
          >
            {isRunning ? 'Running' : isError ? 'Error' : 'Done'}
          </span>
          {expanded ? (
            <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} />
          ) : (
            <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
          )}
        </div>
      </button>

      {/* Tool name chips (only when collapsed and not expanded) */}
      {!expanded && uniqueNames.length > 0 && (
        <div
          className="px-4 pb-3 flex flex-wrap gap-1.5"
          style={{ marginTop: -2 }}
        >
          {uniqueNames.map((name) => (
            <span
              key={name}
              className="px-2 py-0.5 rounded-full"
              style={{
                fontSize: 10,
                color: 'var(--text-sub)',
                background: isPlana ? 'rgba(255,255,255,0.06)' : 'rgba(31,168,255,0.06)',
                border: `1px solid ${isPlana ? 'rgba(105, 183, 255, 0.12)' : 'rgba(31,168,255,0.10)'}`,
              }}
            >
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Expanded timeline */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="timeline"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="px-4 pb-4"
              style={{
                borderTop: `1px solid ${isPlana ? 'rgba(105, 183, 255, 0.12)' : 'var(--line-soft)'}`,
              }}
            >
              <div className="pt-3 flex flex-col gap-2">
                {toolCalls.map((tc) => {
                  const displayName = getToolDisplayName(tc.name);
                  const preview = getPreviewText(tc);
                  const isTcRunning = tc.status === 'running';
                  const isTcError = tc.status === 'error';
                  const duration = tc.finishedAt ? formatDuration(tc.startedAt, tc.finishedAt) : '';

                  return (
                    <div
                      key={tc.id}
                      className="flex items-start gap-3"
                      style={{
                        padding: '8px 10px',
                        borderRadius: 12,
                        background: isPlana ? 'rgba(255,255,255,0.04)' : 'rgba(31,168,255,0.04)',
                      }}
                    >
                      {/* Status icon */}
                      <div className="shrink-0 pt-0.5">
                        {isTcRunning ? (
                          <Loader2 size={13} className="animate-spin" style={{ color: 'var(--primary)' }} />
                        ) : isTcError ? (
                          <AlertCircle size={13} style={{ color: 'var(--danger)' }} />
                        ) : (
                          <div
                            className="flex items-center justify-center"
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: isPlana ? 'rgba(74, 222, 128, 0.15)' : 'rgba(74,222,128,0.12)',
                            }}
                          >
                            <Check size={9} strokeWidth={3} style={{ color: '#4ade80' }} />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span
                            className="font-medium truncate"
                            style={{ fontSize: 12, color: 'var(--text-main)' }}
                          >
                            {displayName}
                          </span>
                          <span
                            className="shrink-0 font-medium"
                            style={{
                              fontSize: 10,
                              color: isTcRunning
                                ? 'var(--primary)'
                                : isTcError
                                  ? 'var(--danger)'
                                  : '#4ade80',
                            }}
                          >
                            {isTcRunning ? 'Running' : isTcError ? 'Failed' : duration || 'Done'}
                          </span>
                        </div>

                        {preview && !isTcError && (
                          <div
                            className="mt-1 truncate"
                            style={{
                              fontSize: 11,
                              color: 'var(--text-sub)',
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {preview}
                          </div>
                        )}

                        {isTcError && tc.result != null && (
                          <div
                            className="mt-1.5 px-2 py-1.5 rounded-md"
                            style={{
                              fontSize: 10,
                              color: 'var(--danger)',
                              background: 'rgba(248,113,113,0.08)',
                              border: '1px solid rgba(248,113,113,0.15)',
                              lineHeight: 1.5,
                            }}
                          >
                            {String(tc.result)}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
