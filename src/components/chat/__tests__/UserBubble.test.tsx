import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserBubble } from '../UserBubble';
import type { Message } from '../../../types';

describe('UserBubble', () => {
  it('renders content and sent status checkmark', () => {
    const message: Message = {
      id: 'msg-2',
      role: 'user',
      content: 'Hello from the user!',
      createdAt: new Date('2026-06-13T14:45:00').getTime(),
    };

    render(<UserBubble message={message} />);

    expect(screen.getByText('Hello from the user!')).toBeInTheDocument();
    expect(screen.getByText(/14:45/)).toBeInTheDocument();
  });
});
