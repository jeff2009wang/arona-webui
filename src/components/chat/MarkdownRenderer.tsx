import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaksInParagraphs from '../../lib/remarkBreaksInParagraphs';
import type { Components } from 'react-markdown';
import { CodeBlock } from './CodeBlock';

function TableWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="markdown-table-wrapper">
      <table>{children}</table>
    </div>
  );
}

const mdComponents: Components = {
  p: ({ children }) => <p className="markdown-p">{children}</p>,
  h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
  h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
  h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
  h4: ({ children }) => <h4 className="markdown-h4">{children}</h4>,
  h5: ({ children }) => <h5 className="markdown-h5">{children}</h5>,
  h6: ({ children }) => <h6 className="markdown-h6">{children}</h6>,
  ul: ({ children }) => <ul className="markdown-ul">{children}</ul>,
  ol: ({ children }) => <ol className="markdown-ol">{children}</ol>,
  li: ({ children }) => <li className="markdown-li">{children}</li>,
  strong: ({ children }) => <strong className="markdown-strong">{children}</strong>,
  em: ({ children }) => <em className="markdown-em">{children}</em>,
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-a">
      {children}
    </a>
  ),
  hr: () => <hr className="markdown-hr" />,
  blockquote: ({ children }) => <blockquote className="markdown-blockquote">{children}</blockquote>,
  code: ({ children, className }) => {
    const isBlock = !!className;
    if (isBlock) {
      return <CodeBlock className={className}>{children}</CodeBlock>;
    }
    return <code className="markdown-inline-code">{children}</code>;
  },
  pre: ({ children }) => <>{children}</>,
  table: ({ children }) => <TableWrapper>{children}</TableWrapper>,
  thead: ({ children }) => <thead className="markdown-thead">{children}</thead>,
  tbody: ({ children }) => <tbody className="markdown-tbody">{children}</tbody>,
  tr: ({ children }) => <tr className="markdown-tr">{children}</tr>,
  th: ({ children }) => <th className="markdown-th">{children}</th>,
  td: ({ children }) => <td className="markdown-td">{children}</td>,
};

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="markdown-content">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaksInParagraphs]} components={mdComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
