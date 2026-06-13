import { useState, useRef } from 'react';
import { Send } from 'lucide-react';

interface ChatComposerProps {
  onSend: (value: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t border-[var(--border)] bg-[var(--bg-card)]">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder="输入消息..."
        rows={1}
        disabled={disabled}
        aria-label="Message input"
        className="flex-1 min-h-[40px] max-h-[120px] px-4 py-3 rounded-2xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-xs outline-none resize-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)] transition-all disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white grid place-items-center shadow-soft-strong disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity shrink-0 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
      >
        <Send size={14} />
      </button>
    </div>
  );
}
