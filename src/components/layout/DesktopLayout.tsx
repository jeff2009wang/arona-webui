import { type ReactNode } from 'react';

export function DesktopLayout({
  history,
  chat,
}: {
  history: ReactNode;
  chat: ReactNode;
}) {
  return (
    <div className="hidden lg:grid lg:grid-cols-[210px_1fr] gap-3 p-4 h-screen">
      {/* HUD corner decorations */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', top: 0, left: 0, width: 72, height: 72,
          borderRight: '1px solid rgba(69,200,255,0.15)',
          borderBottom: '1px solid rgba(69,200,255,0.15)',
          zIndex: 3, pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'fixed', top: 0, right: 0, width: 72, height: 72,
          borderLeft: '1px solid rgba(69,200,255,0.15)',
          borderBottom: '1px solid rgba(69,200,255,0.15)',
          zIndex: 3, pointerEvents: 'none',
        }}
      />
      <div className="h-full overflow-hidden">{history}</div>
      <main className="h-full overflow-hidden">{chat}</main>
    </div>
  );
}
