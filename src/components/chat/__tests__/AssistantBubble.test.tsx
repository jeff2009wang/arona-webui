import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AssistantBubble } from '../AssistantBubble';
import type { Message } from '../../../types';

describe('AssistantBubble', () => {
  it('renders message content and timestamp', () => {
    const message: Message = {
      id: 'msg-1',
      role: 'assistant',
      content: 'Hello from the assistant!',
      createdAt: new Date('2026-06-13T10:30:00').getTime(),
    };

    render(<AssistantBubble message={message} />);

    expect(screen.getByText('Hello from the assistant!')).toBeInTheDocument();
    expect(screen.getByText('10:30')).toBeInTheDocument();
  });
});
