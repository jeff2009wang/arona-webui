import type { Message } from '../../types';

export function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-end gap-2 flex-row-reverse">
      <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] grid place-items-center text-xs text-white shrink-0">
        👤
      </div>
      <div className="max-w-[70%] px-4 py-3 rounded-[20px] rounded-tr-[5px] bg-gradient-to-br from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-xs text-white leading-relaxed shadow-soft-strong">
        {message.content}
        <div className="text-[8px] mt-1 opacity-75 text-right">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓
        </div>
      </div>
    </div>
  );
}
