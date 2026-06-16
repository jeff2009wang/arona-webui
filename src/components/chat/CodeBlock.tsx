import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, Check } from 'lucide-react';
import hljs from 'highlight.js';
import typescript from 'highlight.js/lib/languages/typescript';
import javascript from 'highlight.js/lib/languages/javascript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import markdown from 'highlight.js/lib/languages/markdown';
import 'highlight.js/styles/github-dark.css';

hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('py', python);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('md', markdown);

interface CodeBlockProps {
  children?: React.ReactNode;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const language = className ? className.replace(/language-/, '') : '';
  const codeText = extractText(children);

  const highlighted = language
    ? hljs.highlight(codeText, { language: language || 'plaintext', ignoreIllegals: true }).value
    : escapeHtml(codeText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      console.log('Copy failed');
    }
  };

  return (
    <div
      className="relative group my-2 rounded-xl overflow-hidden"
      style={{
        background: 'rgba(13, 17, 23, 0.92)',
        border: '1px solid rgba(48, 54, 61, 0.6)',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5"
        style={{
          background: 'rgba(22, 27, 34, 0.8)',
          borderBottom: '1px solid rgba(48, 54, 61, 0.4)',
        }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#8b949e' }}>
          {language || 'text'}
        </span>
        <button
          onClick={handleCopy}
          aria-label={copied ? 'Copied' : 'Copy code'}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:outline-none opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
          style={{
            color: copied ? '#3fb950' : '#c9d1d9',
            background: copied ? 'rgba(46, 160, 67, 0.15)' : 'rgba(110, 118, 129, 0.15)',
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-1"
              >
                <Check size={11} strokeWidth={2.5} />
                Copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.6, opacity: 0 }}
                transition={{ duration: 0.12 }}
                className="flex items-center gap-1"
              >
                <Copy size={11} strokeWidth={2} />
                Copy
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Code body */}
      <pre
        className="px-4 py-3 overflow-x-auto"
        style={{
          margin: 0,
          fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Cascadia Code', 'Fira Code', monospace",
          fontSize: 12,
          lineHeight: 1.6,
          whiteSpace: 'pre-wrap',
          wordBreak: 'normal',
          overflowX: 'auto',
        }}
      >
        <code
          className={className}
          dangerouslySetInnerHTML={{ __html: highlighted }}
          style={{ color: '#c9d1d9' }}
        />
      </pre>
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText((node as { props: { children?: React.ReactNode } }).props.children);
  }
  return '';
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
