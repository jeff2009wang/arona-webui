import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AssistantMessageGroup } from '../AssistantMessageGroup';
import type { Message } from '../../../types';

const base: Message = {
  id: 'm1',
  role: 'assistant',
  content: '',
  createdAt: 1700000000000,
};

describe('AssistantMessageGroup', () => {
  it('renders a single assistant message as one bubble', () => {
    const content =
      '可以依次试：\nclaude --version\nclaude doctor\nclaude auth status\n\n如果 claude 都找不到，可能是 PATH 或安装问题。';
    render(<AssistantMessageGroup message={{ ...base, content }} />);

    const bubbles = screen.getAllByTestId('assistant-bubble');
    expect(bubbles).toHaveLength(1);
  });

  it('preserves line breaks inside the bubble', () => {
    const content =
      '可以依次试：\nclaude --version\nclaude doctor\nclaude auth status';
    render(<AssistantMessageGroup message={{ ...base, content }} />);

    const bubble = screen.getByTestId('assistant-bubble');
    expect(bubble).toHaveTextContent('claude --version');
    expect(bubble).toHaveTextContent('claude doctor');
    expect(bubble).toHaveTextContent('claude auth status');
    // Single newlines should be turned into hard line breaks, not collapsed.
    expect(bubble.querySelectorAll('br').length).toBeGreaterThanOrEqual(3);
  });

  it('does not split sentences into separate bubbles', () => {
    const content = '第一句话。第二句话。第三句话。';
    render(<AssistantMessageGroup message={{ ...base, content }} />);

    const bubbles = screen.getAllByTestId('assistant-bubble');
    expect(bubbles).toHaveLength(1);
  });

  it('renders markdown fenced code block with copy button', () => {
    const content = '```bash\nclaude --version\nclaude doctor\n```';
    render(<AssistantMessageGroup message={{ ...base, content }} />);

    const bubble = screen.getByTestId('assistant-bubble');
    expect(bubble).toHaveTextContent('claude --version');
    expect(bubble).toHaveTextContent('claude doctor');
    expect(screen.getByRole('button', { name: /copy code/i })).toBeInTheDocument();
  });
});
