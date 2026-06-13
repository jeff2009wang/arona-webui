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
  const isHistoryOpen = useUIStore((s) => s.isHistoryOpen);
  const isActionsOpen = useUIStore((s) => s.isActionsOpen);

  return (
    <div className="hidden lg:grid lg:grid-cols-[230px_1fr_200px] gap-3 p-3 h-[calc(100vh-var(--header-height))] max-w-[1280px] mx-auto">
      <div className={`h-full overflow-hidden ${isHistoryOpen ? '' : 'hidden'}`}>{history}</div>
      <main className="h-full overflow-hidden">{chat}</main>
      <div className={`h-full overflow-hidden ${isActionsOpen ? '' : 'hidden'}`}>{actions}</div>
    </div>
  );
}
