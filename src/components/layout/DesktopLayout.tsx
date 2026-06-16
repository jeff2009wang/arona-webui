import { type ReactNode } from 'react';

export function DesktopLayout({ chat }: { chat: ReactNode }) {
  return (
    <div className="hidden lg:grid lg:grid-cols-1 gap-3 p-4 h-screen">
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
      <main className="h-full overflow-hidden">{chat}</main>
    </div>
  );
}
