import { type ReactNode } from 'react';
import { useUIStore } from '../../stores/uiStore';

export function DesktopLayout({
  history,
  chat,
  actions,
}: {
  history: ReactNode;
  chat: ReactNode;
  actions: ReactNode;
}) {
  const { isHistoryOpen, isActionsOpen } = useUIStore();

  return (
    <div className="hidden lg:grid lg:grid-cols-[230px_1fr_200px] gap-3 p-3 h-[calc(100vh-50px)] max-w-[1280px] mx-auto">
      {isHistoryOpen && (
        <div className="h-full overflow-hidden">{history}</div>
      )}
      <div className="h-full overflow-hidden">{chat}</div>
      {isActionsOpen && (
        <div className="h-full overflow-hidden">{actions}</div>
      )}
    </div>
  );
}
