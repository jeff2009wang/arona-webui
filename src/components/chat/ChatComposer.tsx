import { useState, useRef, useCallback } from 'react';
import { Send, ImagePlus, X, Loader2 } from 'lucide-react';
import type { Persona } from '../../types';

interface ChatComposerProps {
  onSend: (text: string, images: string[]) => void;
  disabled?: boolean;
  persona?: Persona;
}

const CHAR_NAME: Record<Persona, string> = { arona: 'Arona', plana: 'Plana' };
const MAX_IMAGES = 4;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ChatComposer({ onSend, disabled, persona = 'arona' }: ChatComposerProps) {
  const [value, setValue] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const trimmed = value.trim();
    if ((!trimmed && images.length === 0) || disabled) return;
    onSend(trimmed, images);
    setValue('');
    setImages([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter from sending while the user is composing CJK characters via IME.
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
  };

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const imageFiles = Array.from(files).filter((file) => {
      if (!file.type.startsWith('image/')) return false;
      if (file.size > MAX_FILE_SIZE) {
        console.warn(`Image ${file.name} exceeds 5MB limit`);
        return false;
      }
      return true;
    });
    const remainingSlots = Math.max(0, MAX_IMAGES - images.length);
    const toAdd = imageFiles.slice(0, remainingSlots);
    if (toAdd.length === 0) return;
    try {
      const results = await Promise.all(toAdd.map(fileToBase64));
      setImages((prev) => [...prev, ...results]);
    } catch (e) {
      console.warn('Failed to read image:', e);
    }
  }, [images.length]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const imageFiles = Array.from(e.clipboardData.files).filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length > 0) {
      const dt = new DataTransfer();
      imageFiles.forEach((f) => dt.items.add(f));
      handleFiles(dt.files);
    }
  }, [handleFiles]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const placeholder = `发送消息给 ${CHAR_NAME[persona]}...`;

  return (
    <div
      style={{ borderTop: '1px solid var(--line-soft)', background: 'var(--card-header)', backdropFilter: 'blur(8px)', flexShrink: 0 }}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Image preview strip */}
      {images.length > 0 && (
        <div style={{ display: 'flex', gap: 8, padding: '8px 12px 0', overflowX: 'auto' }}>
          {images.map((src, i) => (
            <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
              <img
                src={src}
                alt={`Preview ${i + 1}`}
                style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10, border: '1.5px solid var(--line)' }}
              />
              <button
                onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label={`Remove image ${i + 1}`}
                style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 16, height: 16, borderRadius: '50%',
                  background: '#f87171', border: 'none',
                  display: 'grid', placeItems: 'center',
                  cursor: 'pointer', color: 'white',
                }}
              >
                <X size={9} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input row */}
      <div className="flex items-end gap-2 p-3">
        {/* Attach image button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          aria-label="Attach image"
          disabled={disabled || images.length >= MAX_IMAGES}
          className="composer-btn attach shrink-0 w-9 h-9 rounded-xl grid place-items-center transition-all focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          style={{
            background: 'var(--tool-bg)',
            border: '1px solid var(--line)',
            color: 'var(--text-sub)',
          }}
        >
          <ImagePlus size={14} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => { handleFiles(e.target.files); if (fileInputRef.current) fileInputRef.current.value = ''; }}
        />

        {/* Text input */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          onPaste={handlePaste}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          aria-label="Message input"
          className="flex-1 min-h-[40px] max-h-[200px] px-4 py-3 rounded-2xl text-xs outline-none resize-none transition-all disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          style={{
            background: 'rgba(255,255,255,0.65)',
            border: '1.5px solid var(--line)',
            color: 'var(--text-main)',
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || (!value.trim() && images.length === 0)}
          aria-label="Send message"
          className="composer-btn send shrink-0 w-10 h-10 rounded-full grid place-items-center transition-all disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none"
          style={{
            background: 'linear-gradient(135deg, var(--primary-light), var(--primary))',
            boxShadow: '0 4px 14px var(--shadow)',
            border: 'none',
            color: 'white',
          }}
        >
          {disabled ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </button>
      </div>
    </div>
  );
}
