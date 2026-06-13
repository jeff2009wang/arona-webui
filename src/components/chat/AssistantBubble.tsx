import type { Message } from '../../types';

export function AssistantBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-[10px] bg-[var(--tool-bg)] border border-[var(--border)] grid place-items-center text-xs shrink-0">
        🎓
      </div>
      <div className="max-w-[70%] px-4 py-3 rounded-[20px] rounded-tl-[5px] bg-[var(--bubble-assistant)] border border-[var(--border)] text-xs text-[var(--text-main)] leading-relaxed shadow-soft">
        {message.content}
        <div className="text-[8px] mt-1 opacity-65 text-right">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
