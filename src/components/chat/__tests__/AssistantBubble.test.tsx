import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AssistantBubble } from '../AssistantBubble';
import type { Message } from '../../../types';

const base: Message = { id: 'm1', role: 'assistant', content: 'Hello!', createdAt: 1700000000000 };

describe('AssistantBubble', () => {
  it('renders text content', () => {
    render(<AssistantBubble message={base} />);
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('renders markdown bold', () => {
    render(<AssistantBubble message={{ ...base, content: '**bold text**' }} />);
    expect(screen.getByText('bold text').tagName).toBe('STRONG');
  });

  it('renders markdown code block', () => {
    render(<AssistantBubble message={{ ...base, content: '```\ncode here\n```' }} />);
    expect(screen.getByText('code here')).toBeInTheDocument();
  });

  it('renders timestamp', () => {
    render(<AssistantBubble message={base} />);
    // timestamp renders as HH:MM
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });
});
