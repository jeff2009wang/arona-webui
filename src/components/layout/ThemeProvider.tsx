import { useEffect, type ReactNode } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const persona = useSettingsStore((state) => state.persona);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', persona);
  }, [persona]);

  return <>{children}</>;
}
