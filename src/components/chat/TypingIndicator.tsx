export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <img
        src="/assets/placeholders/avatar-arona.svg"
        alt="Typing"
        width={28}
        height={28}
        style={{ borderRadius: '50%', flexShrink: 0 }}
      />
      <div
        className="flex items-center gap-1 px-4 py-3"
        style={{
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          background: 'var(--bubble-ai)',
          border: '1px solid var(--line-soft)',
          backdropFilter: 'blur(8px)',
        }}
      >
        {[0, 200, 400].map((delay) => (
          <span
            key={delay}
            data-testid="typing-dot"
            className="w-[5px] h-[5px] rounded-full motion-safe:animate-bounce"
            style={{ background: 'var(--primary)', animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
