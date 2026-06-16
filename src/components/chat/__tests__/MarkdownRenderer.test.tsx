import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MarkdownRenderer } from '../MarkdownRenderer';

describe('MarkdownRenderer', () => {
  it('renders paragraphs', () => {
    render(<MarkdownRenderer content="Hello world" />);
    expect(screen.getByText('Hello world')).toBeInTheDocument();
  });

  it('preserves single newlines as hard line breaks', () => {
    const { container } = render(
      <MarkdownRenderer content={"Line 1\nLine 2\nLine 3"} />
    );
    const brs = container.querySelectorAll('br');
    expect(brs.length).toBeGreaterThanOrEqual(2);
  });

  it('renders fenced code blocks', () => {
    const { container } = render(
      <MarkdownRenderer content={"```bash\nclaude --version\n```"} />
    );
    expect(container.querySelector('pre')).toBeInTheDocument();
    expect(container.querySelector('code')).toHaveTextContent('claude --version');
  });

  it('renders inline code', () => {
    const { container } = render(<MarkdownRenderer content="use `npm install`" />);
    expect(container.querySelector('code')).toHaveTextContent('npm install');
  });

  it('renders lists', () => {
    const content = ['- first', '- second'].join('\n');
    render(<MarkdownRenderer content={content} />);
    expect(screen.getByText('first')).toBeInTheDocument();
    expect(screen.getByText('second')).toBeInTheDocument();
  });
});
