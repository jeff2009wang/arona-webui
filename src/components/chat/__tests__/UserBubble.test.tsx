import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { UserBubble } from '../UserBubble';
import type { Message } from '../../../types';

const base: Message = { id: 'm1', role: 'user', content: 'Hello!', createdAt: 1700000000000 };

describe('UserBubble', () => {
  it('renders message content', () => {
    render(<UserBubble message={base} />);
    expect(screen.getByText('Hello!')).toBeInTheDocument();
  });

  it('renders timestamp', () => {
    render(<UserBubble message={base} />);
    expect(screen.getByText(/\d{1,2}:\d{2}/)).toBeInTheDocument();
  });

  it('renders image thumbnails when images present', () => {
    const msg = { ...base, images: ['data:image/png;base64,abc123', 'data:image/png;base64,def456'] };
    render(<UserBubble message={msg} />);
    const imgs = screen.getAllByRole('img');
    expect(imgs).toHaveLength(2);
  });

  it('shows no images when images array is empty', () => {
    render(<UserBubble message={{ ...base, images: [] }} />);
    expect(screen.queryByRole('img')).toBeNull();
  });
});
