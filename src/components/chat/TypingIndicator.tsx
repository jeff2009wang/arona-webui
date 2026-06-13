export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-7 h-7 rounded-[10px] bg-[var(--tool-bg)] border border-[var(--border)] grid place-items-center text-xs shrink-0">
        🎓
      </div>
      <div className="flex items-center gap-1 px-4 py-3 rounded-[18px] rounded-tl-[5px] bg-[var(--bubble-assistant)] border border-[var(--border)] shadow-soft">
        <span className="w-[5px] h-[5px] rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-[5px] h-[5px] rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '200ms' }} />
        <span className="w-[5px] h-[5px] rounded-full bg-[var(--primary)] animate-bounce" style={{ animationDelay: '400ms' }} />
      </div>
    </div>
  );
}
