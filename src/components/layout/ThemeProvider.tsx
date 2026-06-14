import { useEffect, useState, type ReactNode } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Persona } from '../../types';

const BG_PATHS: Record<Persona, string> = {
  arona: '/assets/local/backgrounds/arona-light.png',
  plana: '/assets/local/backgrounds/plana-dark.png',
};

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

export function ThemeProvider({ children }: { children: ReactNode }) {
  const persona = useSettingsStore((s) => s.persona);
  const enableCgBackground = useSettingsStore((s) => s.enableCgBackground);
  const backgroundOpacity = useSettingsStore((s) => s.backgroundOpacity);
  const backgroundBlur = useSettingsStore((s) => s.backgroundBlur);
  const [hasCgBg, setHasCgBg] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', persona);
  }, [persona]);

  useEffect(() => {
    let cancelled = false;
    if (!enableCgBackground) {
      setHasCgBg(false);
      return;
    }
    probeImage(BG_PATHS[persona]).then((ok) => {
      if (!cancelled) setHasCgBg(ok);
    });
    return () => {
      cancelled = true;
    };
  }, [persona, enableCgBackground]);

  const bgStyle = hasCgBg
    ? `${buildOverlay(persona, backgroundOpacity)}, url("${BG_PATHS[persona]}") center/cover no-repeat`
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
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, minHeight: '100vh' }}>
        {children}
      </div>
    </>
  );
}
