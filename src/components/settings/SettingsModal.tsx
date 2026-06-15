import { X, Upload } from 'lucide-react';
import { useRef } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useSessionStore } from '../../stores/sessionStore';
import { useUIStore } from '../../stores/uiStore';

export function SettingsModal() {
  const isSettingsOpen = useUIStore((s) => s.isSettingsOpen);
  const closeSettings = useUIStore((s) => s.closeSettings);
  const { persona, baseUrl, apiKey, model, temperature, maxTokens, systemPrompt,
          enableCgBackground, backgroundOpacity, backgroundBlur,
          updateConfig, setPersona, resetToDefaults } = useSettingsStore((s) => s);
  const exportToFile = useSessionStore((s) => s.exportToFile);
  const importFromFile = useSessionStore((s) => s.importFromFile);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!isSettingsOpen) return null;

  const field = (label: string, id: string, node: React.ReactNode) => (
    <div>
      <label htmlFor={id} className="block text-[9px] font-black text-[var(--primary)] uppercase tracking-wider mb-1.5">
        {label}
      </label>
      {node}
    </div>
  );

  const inputClass = "w-full px-3 py-2.5 rounded-xl text-[11px] outline-none transition-all focus:shadow-[0_0_0_3px_var(--hud)]";
  const inputStyle = { background: 'var(--tool-bg)', border: '1.5px solid var(--line)', color: 'var(--text-main)' };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="w-full max-w-[480px] max-h-[82vh] flex flex-col overflow-hidden"
        style={{
          background: 'var(--card)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--line)',
          borderRadius: 24,
          boxShadow: '0 24px 80px var(--shadow)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--line-soft)', background: 'var(--card-header)' }}
        >
          <h2 className="text-[14px] font-black" style={{ color: 'var(--text-main)' }}>Settings</h2>
          <button
            onClick={closeSettings}
            aria-label="Close settings"
            className="w-8 h-8 rounded-xl grid place-items-center transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            style={{ background: 'var(--tool-bg)', border: '1px solid var(--line)', color: 'var(--text-sub)' }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* Theme */}
          <div>
            <div className="text-[9px] font-black text-[var(--primary)] uppercase tracking-wider mb-2">Theme</div>
            <div className="flex items-center gap-1 p-1 rounded-full w-fit" style={{ background: 'var(--tool-bg)', border: '1px solid var(--line)' }}>
              {(['arona', 'plana'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPersona(p)}
                  aria-pressed={persona === p}
                  aria-label={p === 'arona' ? 'Arona' : 'Plana'}
                  className="px-4 py-1.5 rounded-full text-[10px] font-black capitalize transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
                  style={persona === p
                    ? { background: 'linear-gradient(135deg, var(--primary-light), var(--primary))', color: 'white' }
                    : { color: 'var(--text-sub)' }}
                >
                  {p === 'arona' ? 'Arona' : 'Plana'}
                </button>
              ))}
            </div>
          </div>

          {/* API Connection */}
          {field('API Connection', 'settings-base-url',
            <>
              <input id="settings-base-url" type="text" value={baseUrl} placeholder="Base URL"
                onChange={(e) => updateConfig({ baseUrl: e.target.value })}
                className={inputClass} style={inputStyle} />
              <input id="settings-api-key" type="password" value={apiKey} placeholder="API Key"
                onChange={(e) => updateConfig({ apiKey: e.target.value })}
                className={`${inputClass} mt-2`} style={inputStyle} />
            </>
          )}

          {/* Model + Temperature + Max Tokens */}
          <div className="grid grid-cols-3 gap-3">
            {field('Model', 'settings-model',
              <input id="settings-model" type="text" value={model} placeholder="gpt-4o-mini"
                onChange={(e) => updateConfig({ model: e.target.value })}
                className={inputClass} style={inputStyle} />
            )}
            {field('Temperature', 'settings-temperature',
              <input id="settings-temperature" type="number" min="0" max="2" step="0.1" value={temperature}
                onChange={(e) => { const val = parseFloat(e.target.value); if (!isNaN(val)) updateConfig({ temperature: val }); }}
                className={inputClass} style={inputStyle} />
            )}
            {field('Max Tokens', 'settings-max-tokens',
              <input id="settings-max-tokens" type="number" min="256" max="128000" step="256" value={maxTokens}
                aria-label="Max tokens"
                onChange={(e) => { const val = parseInt(e.target.value, 10); if (!isNaN(val)) updateConfig({ maxTokens: val }); }}
                className={inputClass} style={inputStyle} />
            )}
          </div>

          {/* System Prompt */}
          {field('System Prompt', 'settings-system-prompt',
            <textarea id="settings-system-prompt" value={systemPrompt} rows={4}
              onChange={(e) => updateConfig({ systemPrompt: e.target.value })}
              className={`${inputClass} resize-y`} style={inputStyle} />
          )}

          {/* Background */}
          <div>
            <div className="text-[9px] font-black text-[var(--primary)] uppercase tracking-wider mb-3">Background</div>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableCgBackground}
                  aria-label="Enable CG background"
                  onChange={(e) => updateConfig({ enableCgBackground: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--primary)]"
                />
                <span className="text-[11px]" style={{ color: 'var(--text-main)' }}>Enable CG Background</span>
              </label>

              <div>
                <label className="text-[10px] font-semibold" style={{ color: 'var(--text-sub)' }}>
                  Overlay Opacity: {Math.round(backgroundOpacity * 100)}%
                </label>
                <input
                  type="range" min="0" max="1" step="0.05" value={backgroundOpacity}
                  onChange={(e) => updateConfig({ backgroundOpacity: parseFloat(e.target.value) })}
                  className="w-full mt-1 accent-[var(--primary)]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold" style={{ color: 'var(--text-sub)' }}>
                  Background Blur: {backgroundBlur}px
                </label>
                <input
                  type="range" min="0" max="20" step="1" value={backgroundBlur}
                  onChange={(e) => updateConfig({ backgroundBlur: parseInt(e.target.value, 10) })}
                  className="w-full mt-1 accent-[var(--primary)]"
                />
              </div>

              <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                Place your background at:<br />
                <code style={{ fontSize: 9 }}>public/assets/local/backgrounds/arona-light.png</code><br />
                <code style={{ fontSize: 9 }}>public/assets/local/backgrounds/plana-dark.png</code>
              </p>

              <button
                onClick={() => updateConfig({ enableCgBackground: true, backgroundOpacity: 0.75, backgroundBlur: 0 })}
                className="text-[10px] font-semibold px-3 py-2 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
                style={{ border: '1px solid var(--line)', color: 'var(--text-sub)', background: 'var(--tool-bg)' }}
              >
                Reset Background to Defaults
              </button>
            </div>
          </div>

          {/* Export / Import */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportToFile}
              aria-label="Export sessions to JSON file"
              className="py-2.5 rounded-xl text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
              style={{ border: '1px solid var(--line)', color: 'var(--text-sub)', background: 'var(--tool-bg)' }}
            >
              Export Sessions
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Import sessions from JSON file"
              className="py-2.5 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
              style={{ border: '1px solid var(--line)', color: 'var(--text-sub)', background: 'var(--tool-bg)' }}
            >
              <Upload size={12} /> Import
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden"
              onChange={(e) => e.target.files?.[0] && importFromFile(e.target.files[0])} />
          </div>

          {/* Reset */}
          <button
            onClick={resetToDefaults}
            className="py-2 rounded-xl text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:outline-none"
            style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', background: 'rgba(248,113,113,0.05)' }}
          >
            Reset All to Defaults
          </button>
        </div>
      </div>
    </div>
  );
}
