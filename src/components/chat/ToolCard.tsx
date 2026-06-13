import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { ToolCall } from '../../types';

interface ToolCardProps {
  toolCall: ToolCall;
}

export function ToolCard({ toolCall }: ToolCardProps) {
  const [expanded, setExpanded] = useState(false);

  const isRunning = toolCall.status === 'running';
  const statusColor =
    toolCall.status === 'success' ? 'text-green-400' : toolCall.status === 'error' ? 'text-red-400' : 'text-[var(--primary)]';

  return (
    <div className="max-w-[76%] bg-[var(--tool-bg)] border border-[var(--border)] rounded-2xl p-3 shadow-soft">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--primary)]">
          <span>🔧</span>
          <span>Tool Call · {toolCall.name}</span>
        </div>
        <div className={`flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] ${statusColor}`}>
          {isRunning && <span className="w-1 h-1 rounded-full bg-[var(--primary)] motion-safe:animate-pulse" />}
          {toolCall.status}
        </div>
      </div>

      <div className="text-[10px] text-[var(--text-secondary)] px-2 py-1.5 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl font-mono">
        {expanded ? JSON.stringify(toolCall.arguments, null, 2) : toolCall.result ? String(toolCall.result).slice(0, 60) : 'Running...'}
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        aria-label={expanded ? 'Hide details' : 'Show details'}
        className="flex items-center gap-1 mt-2 text-[10px] text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:rounded-md focus-visible:outline-none"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        {expanded ? 'Collapse' : 'Details'}
      </button>
    </div>
  );
}
