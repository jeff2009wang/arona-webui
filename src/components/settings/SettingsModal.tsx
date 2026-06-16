import { X, Eye, EyeOff } from 'lucide-react';
import { useRef, useEffect, useState, forwardRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../ui/ConfirmDialog';

/* ─── PasswordInput (local reuse) ─── */
export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label, className = '', style, ...rest }, ref) => {
    const [visible, setVisible] = useState(false);
    return (
      <div className="w-full">
        {label && (
          <label className="block text-[9px] font-black text-[var(--primary)] uppercase tracking-wider mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={visible ? 'text' : 'password'}
            className={`w-full px-3 py-2.5 pr-10 rounded-xl text-[11px] outline-none transition-all focus:shadow-[0_0_0_3px_var(--hud)] ${className}`}
            style={{ background: 'var(--tool-bg)', border: '1.5px solid var(--line)', color: 'var(--text-main)', ...style }}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg grid place-items-center transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
            style={{ color: 'var(--text-muted)' }}
            tabIndex={-1}
          >
            {visible ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = 'PasswordInput';

/* ─── SettingsModal ─── */
export function SettingsModal() {
  const isSettingsOpen = useUIStore((s) => s.isSettingsOpen);
  const closeSettings = useUIStore((s) => s.closeSettings);
  const {
    persona, baseUrl, apiKey, model, temperature, maxTokens, systemPrompt,
    enableCgBackground, backgroundOpacity, backgroundBlur,
    streamEnabled, localBackgroundPath, localAvatarPath, autoSummarize,
    updateConfig, setPersona, resetToDefaults, clearAllData,
  } = useSettingsStore((s) => s);
  const { toast } = useToast();

  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);

  // Close modal on Escape.
  useEffect(() => {
    if (!isSettingsOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSettings();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, closeSettings]);

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
    <>
    <AnimatePresence>
      {isSettingsOpen && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Settings"
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSettings();
          }}
        >
          <motion.div
            className="w-full max-w-[480px] max-h-[82vh] flex flex-col overflow-hidden"
            style={{
              background: 'var(--card)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid var(--line)',
              borderRadius: 24,
              boxShadow: '0 24px 80px var(--shadow)',
            }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
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
                  <div className="mt-2">
                    <PasswordInput
                      id="settings-api-key"
                      value={apiKey}
                      placeholder="API Key"
                      onChange={(e) => updateConfig({ apiKey: e.target.value })}
                    />
                  </div>
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

              {/* Stream toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={streamEnabled ?? true}
                  aria-label="Enable streaming"
                  onChange={(e) => updateConfig({ streamEnabled: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--primary)]"
                />
                <span className="text-[11px]" style={{ color: 'var(--text-main)' }}>Enable Streaming</span>
              </label>

              {/* Auto summarize toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoSummarize ?? false}
                  aria-label="Auto summarize session"
                  onChange={(e) => updateConfig({ autoSummarize: e.target.checked })}
                  className="w-4 h-4 rounded accent-[var(--primary)]"
                />
                <span className="text-[11px]" style={{ color: 'var(--text-main)' }}>Auto Summarize Session</span>
              </label>
              <p className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
                Local rules always generate titles. When enabled, Arona will also ask the backend LLM to refine titles and summaries.
              </p>

              {/* Local Background Path */}
              {field('Local Background Path', 'settings-local-bg',
                <input id="settings-local-bg" type="text" value={localBackgroundPath ?? ''} placeholder="e.g. /assets/local/backgrounds/custom.jpg"
                  onChange={(e) => updateConfig({ localBackgroundPath: e.target.value })}
                  className={inputClass} style={inputStyle} />
              )}

              {/* Local Avatar Path */}
              {field('Local Avatar Path', 'settings-local-avatar',
                <input id="settings-local-avatar" type="text" value={localAvatarPath ?? ''} placeholder="e.g. /assets/local/avatars/arona.png"
                  onChange={(e) => updateConfig({ localAvatarPath: e.target.value })}
                  className={inputClass} style={inputStyle} />
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
                    Place your background at (supports .jpg, .png, .webp):<br />
                    <code style={{ fontSize: 9 }}>public/assets/local/backgrounds/arona-light.jpg</code><br />
                    <code style={{ fontSize: 9 }}>public/assets/local/backgrounds/plana-dark.jpg</code>
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

              {/* Reset */}
              <button
                onClick={() => setConfirmResetOpen(true)}
                className="py-2 rounded-xl text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:outline-none"
                style={{ border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', background: 'rgba(248,113,113,0.05)' }}
              >
                Reset All to Defaults
              </button>

              {/* Clear All Local Data */}
              <button
                onClick={() => setConfirmClearOpen(true)}
                className="py-2 rounded-xl text-[10px] font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-[var(--danger)] focus-visible:outline-none"
                style={{ border: '1px solid rgba(248,113,113,0.45)', color: '#ef4444', background: 'rgba(248,113,113,0.08)' }}
              >
                Clear All Local Data
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* Confirm dialogs */}
    <ConfirmDialog
      isOpen={confirmResetOpen}
      title="Reset to Defaults?"
      message="This will restore all settings to their default values. Your chat sessions will remain intact."
      confirmText="Reset"
      cancelText="Cancel"
      variant="danger"
      onConfirm={() => { resetToDefaults(); setConfirmResetOpen(false); toast.success('Settings reset to defaults'); }}
      onCancel={() => setConfirmResetOpen(false)}
    />
    <ConfirmDialog
      isOpen={confirmClearOpen}
      title="Clear All Local Data?"
      message="This will permanently delete all sessions and settings. This action cannot be undone."
      confirmText="Clear"
      cancelText="Cancel"
      variant="danger"
      onConfirm={() => { clearAllData(); setConfirmClearOpen(false); }}
      onCancel={() => setConfirmClearOpen(false)}
    />
  </>
  );
}
