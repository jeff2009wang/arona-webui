import { X, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useUIStore } from '../../stores/uiStore';

export function SettingsModal() {
  const isSettingsOpen = useUIStore((s) => s.isSettingsOpen);
  const closeSettings = useUIStore((s) => s.closeSettings);
  const persona = useSettingsStore((s) => s.persona);
  const setPersona = useSettingsStore((s) => s.setPersona);
  const baseUrl = useSettingsStore((s) => s.baseUrl);
  const apiKey = useSettingsStore((s) => s.apiKey);
  const model = useSettingsStore((s) => s.model);
  const temperature = useSettingsStore((s) => s.temperature);
  const systemPrompt = useSettingsStore((s) => s.systemPrompt);
  const updateConfig = useSettingsStore((s) => s.updateConfig);
  const exportToFile = useSessionStore((s) => s.exportToFile);
  const importFromFile = useSessionStore((s) => s.importFromFile);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isSettingsOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
    >
      <div className="w-full max-w-[480px] max-h-[80vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl shadow-[0_24px_64px_var(--shadow-strong)] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <h2 className="text-[15px] font-bold text-[var(--text-main)]">Terminal Settings</h2>
          <button
            onClick={closeSettings}
            aria-label="Close settings"
            className="w-8 h-8 rounded-lg border border-[var(--border)] bg-[var(--bg-card)] grid place-items-center text-[var(--text-secondary)] hover:text-[var(--primary)] focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          >
            <X size={14} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <div>
            <label className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Personality</label>
            <div className="flex items-center gap-1 mt-1.5 p-1 rounded-full border border-[var(--border)] bg-[var(--bg-card)] w-fit">
              <button
                onClick={() => setPersona('arona')}
                aria-pressed={persona === 'arona'}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none ${
                  persona === 'arona'
                    ? 'bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Arona
              </button>
              <button
                onClick={() => setPersona('plana')}
                aria-pressed={persona === 'plana'}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none ${
                  persona === 'plana'
                    ? 'bg-gradient-to-r from-[var(--bubble-user-start)] to-[var(--bubble-user-end)] text-white'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                Plana
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="settings-base-url" className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">API Connection</label>
            <input
              id="settings-base-url"
              type="text"
              value={baseUrl}
              onChange={(e) => updateConfig({ baseUrl: e.target.value })}
              placeholder="Base URL"
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-[11px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)]"
            />
            <input
              id="settings-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => updateConfig({ apiKey: e.target.value })}
              placeholder="API Key"
              className="mt-2 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-[11px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="settings-model" className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Model</label>
              <input
                id="settings-model"
                type="text"
                value={model}
                onChange={(e) => updateConfig({ model: e.target.value })}
                placeholder="gpt-4o-mini"
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-[11px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)]"
              />
            </div>
            <div>
              <label htmlFor="settings-temperature" className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">Temperature</label>
              <input
                id="settings-temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => updateConfig({ temperature: parseFloat(e.target.value) })}
                className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-[11px] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="settings-system-prompt" className="text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider">System Prompt</label>
            <textarea
              id="settings-system-prompt"
              value={systemPrompt}
              onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
              rows={4}
              className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--tool-bg)] text-[var(--text-main)] text-[11px] outline-none resize-y focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_var(--hud)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportToFile}
              aria-label="Export sessions to JSON file"
              className="py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[11px] font-semibold hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            >
              Export Sessions
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Import sessions from JSON file"
              className="py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text-main)] text-[11px] font-semibold flex items-center justify-center gap-1 hover:border-[var(--primary)] hover:text-[var(--primary)] transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            >
              <Upload size={12} /> Import Sessions
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])}
              className="hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
