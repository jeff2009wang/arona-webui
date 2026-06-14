import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../types';
import type { Components } from 'react-markdown';
import type { Persona } from '../../types';

const AVATAR: Record<Persona, string> = {
  arona: '/assets/placeholders/avatar-arona.svg',
  plana: '/assets/placeholders/avatar-plana.svg',
};

const mdComponents: Components = {
  p: ({ children }) => <p style={{ margin: '0 0 0.5em', lineHeight: 1.6 }}>{children}</p>,
  strong: ({ children }) => <strong style={{ fontWeight: 700, color: 'var(--text-main)' }}>{children}</strong>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
      {children}
    </a>
  ),
  code: ({ children, className }) => {
    const isBlock = !!className;
    return isBlock ? (
      <code style={{ display: 'block', fontFamily: "'SF Mono','Menlo',monospace", fontSize: 11, lineHeight: 1.55 }}>
        {children}
      </code>
    ) : (
      <code style={{ fontFamily: "'SF Mono','Menlo',monospace", background: 'var(--tool-bg)', borderRadius: 4, padding: '1px 5px', fontSize: '0.85em' }}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre style={{ background: 'rgba(0,0,0,0.05)', borderRadius: 10, padding: '10px 12px', overflowX: 'auto', margin: '0.5em 0' }}>
      {children}
    </pre>
  ),
  ul: ({ children }) => <ul style={{ paddingLeft: '1.2em', margin: '0.4em 0' }}>{children}</ul>,
  ol: ({ children }) => <ol style={{ paddingLeft: '1.2em', margin: '0.4em 0' }}>{children}</ol>,
  li: ({ children }) => <li style={{ marginBottom: '0.2em' }}>{children}</li>,
  blockquote: ({ children }) => (
    <blockquote style={{ borderLeft: '3px solid var(--primary)', paddingLeft: 10, color: 'var(--text-sub)', margin: '0.5em 0' }}>
      {children}
    </blockquote>
  ),
  table: ({ children }) => <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>{children}</table>,
  th: ({ children }) => <th style={{ border: '1px solid var(--line)', padding: '5px 9px', background: 'var(--tool-bg)', fontWeight: 700 }}>{children}</th>,
  td: ({ children }) => <td style={{ border: '1px solid var(--line)', padding: '5px 9px' }}>{children}</td>,
};

export function AssistantBubble({ message, persona = 'arona' }: { message: Message; persona?: Persona }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex items-end gap-2">
      {/* Avatar */}
      <img
        src={AVATAR[persona]}
        alt={persona === 'arona' ? 'Arona' : 'Plana'}
        width={28}
        height={28}
        style={{ borderRadius: '50%', flexShrink: 0, boxShadow: '0 2px 8px var(--shadow)' }}
      />
      <div>
        {/* Bubble */}
        <div
          style={{
            maxWidth: '68%',
            padding: '10px 14px',
            borderRadius: 18,
            borderBottomLeftRadius: 4,
            background: 'var(--bubble-ai)',
            border: '1px solid var(--line-soft)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: '0 4px 16px var(--shadow)',
            fontSize: 12,
            color: 'var(--text-main)',
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
            {message.content}
          </ReactMarkdown>
        </div>
        {/* Timestamp */}
        <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>
          {time}
        </div>
      </div>
    </div>
  );
}
