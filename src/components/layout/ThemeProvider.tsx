import { useEffect, useState, type ReactNode } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Persona } from '../../types';

const BG_EXTENSIONS = ['.jpg', '.png', '.webp'] as const;

const FALLBACK_BG: Record<Persona, string> = {
  arona: 'linear-gradient(145deg,#c9eeff 0%,#a8d8f0 18%,#d4f0ff 35%,#b8e8ff 50%,#e8f8ff 65%,#cce8f8 80%,#b0d8f0 100%)',
  plana: 'linear-gradient(145deg,#0a1322 0%,#0d1a30 40%,#091220 100%)',
};

function buildOverlay(persona: Persona, opacity: number): string {
  const o = Math.max(0, Math.min(1, opacity));
  if (persona === 'arona') {
    const a1 = (0.72 * o).toFixed(2);
    const a2 = (0.86 * o).toFixed(2);
    return `linear-gradient(rgba(235,250,255,${a1}),rgba(235,250,255,${a2}))`;
  }
  const a1 = (0.70 * o).toFixed(2);
  const a2 = (0.88 * o).toFixed(2);
  return `linear-gradient(rgba(8,14,28,${a1}),rgba(8,14,28,${a2}))`;
}

function probeImage(src: string): Promise<boolean> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

async function findBackground(persona: Persona, localPath?: string): Promise<string | null> {
  // If user provided a local path, probe it first.
  if (localPath && localPath.trim().length > 0) {
    const trimmed = localPath.trim();
    if (await probeImage(trimmed)) return trimmed;
  }
  // Fallback to persona-named files in public folder.
  for (const ext of BG_EXTENSIONS) {
    const src = `/assets/local/backgrounds/${persona === 'arona' ? 'arona-light' : 'plana-dark'}${ext}`;
    if (await probeImage(src)) return src;
  }
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const persona = useSettingsStore((s) => s.persona);
  const enableCgBackground = useSettingsStore((s) => s.enableCgBackground);
  const backgroundOpacity = useSettingsStore((s) => s.backgroundOpacity);
  const backgroundBlur = useSettingsStore((s) => s.backgroundBlur);
  const localBackgroundPath = useSettingsStore((s) => s.localBackgroundPath);
  const [bgSrc, setBgSrc] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', persona);
  }, [persona]);

  useEffect(() => {
    let cancelled = false;
    if (!enableCgBackground) {
      setBgSrc(null);
      return;
    }
    findBackground(persona, localBackgroundPath).then((src) => {
      if (!cancelled) setBgSrc(src);
    });
    return () => {
      cancelled = true;
    };
  }, [persona, enableCgBackground, localBackgroundPath]);

  const bgStyle = bgSrc
    ? `${buildOverlay(persona, backgroundOpacity)}, url("${bgSrc}") center/cover no-repeat`
    : FALLBACK_BG[persona];

  const blurPx = backgroundBlur > 0 ? backgroundBlur : undefined;
  const insetVal = blurPx ? `-${blurPx * 2}px` : '0';

  return (
    <>
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: insetVal,
          zIndex: 0,
          background: bgStyle,
          filter: blurPx ? `blur(${blurPx}px)` : undefined,
          transition: 'background 400ms ease, filter 400ms ease',
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh' }}>
        {children}
      </div>
    </>
  );
}
