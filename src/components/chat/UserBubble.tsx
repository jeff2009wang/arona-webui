import { useState } from 'react';
import type { Message } from '../../types';

export function UserBubble({ message }: { message: Message }) {
  const [preview, setPreview] = useState<string | null>(null);
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const hasImages = message.images && message.images.length > 0;

  return (
    <div className="flex items-end justify-end gap-2">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: '68%' }}>
        {/* Image thumbnails */}
        {hasImages && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {message.images!.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`Attachment ${i + 1}`}
                onClick={() => setPreview(src)}
                style={{
                  width: 72, height: 72, objectFit: 'cover',
                  borderRadius: 12, cursor: 'pointer',
                  border: '2px solid rgba(255,255,255,0.5)',
                  boxShadow: '0 2px 8px var(--shadow)',
                }}
              />
            ))}
          </div>
        )}

        {/* Text bubble */}
        {message.content && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 18,
              borderBottomRightRadius: 4,
              background: 'linear-gradient(135deg, var(--bubble-user-from), var(--bubble-user-to))',
              color: 'white',
              fontSize: 12,
              lineHeight: 1.6,
              boxShadow: '0 6px 20px var(--shadow)',
            }}
          >
            {message.content}
          </div>
        )}

        {/* Timestamp */}
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>
          {time}
        </div>
      </div>

      {/* User avatar — decorative, hidden from accessibility tree */}
      <span aria-hidden="true">
        <img
          src="/assets/placeholders/avatar-user.svg"
          alt=""
          width={28}
          height={28}
          style={{ borderRadius: '50%', flexShrink: 0, border: '1.5px solid var(--line)' }}
        />
      </span>

      {/* Full-screen image preview dialog */}
      {preview && (
        <dialog
          open
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.85)', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '100vw', maxWidth: '100vw', maxHeight: '100vh',
          }}
        >
          <img
            src={preview}
            alt="Preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain' }}
          />
        </dialog>
      )}
    </div>
  );
}
