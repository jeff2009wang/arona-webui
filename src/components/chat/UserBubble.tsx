import { useState } from 'react';
import type { Message } from '../../types';
import { MessageActions } from './MessageActions';

export function UserBubble({ message }: { message: Message }) {
  const [preview, setPreview] = useState<string | null>(null);
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const hasImages = message.images && message.images.length > 0;

  return (
    <div
      className="message-row user"
      style={{ display: 'flex', alignItems: 'flex-end', gap: 10, width: '100%', margin: '18px 0', justifyContent: 'flex-end' }}
    >
      <div
        className="message-stack"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', maxWidth: 'min(620px, 58%)', position: 'relative' }}
      >
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
        {(message.content || !hasImages) && (
          <div
            className="message-bubble"
            style={{
              display: 'inline-block',
              width: 'max-content',
              maxWidth: '100%',
              boxSizing: 'border-box',
              padding: '14px 18px',
              borderRadius: 22,
              borderBottomRightRadius: 8,
              background: 'linear-gradient(135deg, var(--bubble-user-from), var(--bubble-user-to))',
              color: 'white',
              boxShadow: '0 6px 20px var(--shadow)',
            }}
          >
            <div
              className="message-text"
              style={{
                display: 'block',
                width: 'max-content',
                maxWidth: '100%',
                fontSize: 16,
                lineHeight: 1.6,
                fontWeight: 500,
                letterSpacing: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'normal',
                overflowWrap: 'break-word',
                lineBreak: 'loose',
              }}
            >
              {Array.isArray(message.content)
                ? message.content
                    .filter((n) => n.type === 'text')
                    .map((n) => (n as { content: string }).content)
                    .join('')
                : message.content}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div
          className="message-time"
          style={{ marginTop: 6, fontSize: 12, opacity: 0.55, color: 'var(--text-muted)' }}
        >
          {time}
        </div>

        {/* Message actions hover bar */}
        <div className="message-actions-wrapper">
          <MessageActions message={message} />
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
