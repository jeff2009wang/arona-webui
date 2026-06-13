import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatHeader } from '../ChatHeader';

describe('ChatHeader', () => {
  it('renders name, status, and avatar', () => {
    render(
      <ChatHeader
        name="Arona"
        status="Online"
        avatar="🎓"
      />
    );

    expect(screen.getByText('Arona')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.getByText('🎓')).toBeInTheDocument();
  });

  it('calls onRegenerate when regenerate button is clicked', () => {
    const onRegenerate = vi.fn();
    render(
      <ChatHeader
        name="Arona"
        status="Online"
        avatar="🎓"
        onRegenerate={onRegenerate}
      />
    );

    const regenerateButton = screen.getByRole('button', { name: /regenerate/i });
    fireEvent.click(regenerateButton);
    expect(onRegenerate).toHaveBeenCalledTimes(1);
  });

  it('calls onStop when stop button is clicked', () => {
    const onStop = vi.fn();
    render(
      <ChatHeader
        name="Arona"
        status="Online"
        avatar="🎓"
        onStop={onStop}
      />
    );

    const stopButton = screen.getByRole('button', { name: /stop/i });
    fireEvent.click(stopButton);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('has accessible labels on all action buttons', () => {
    render(
      <ChatHeader
        name="Arona"
        status="Online"
        avatar="🎓"
      />
    );

    expect(screen.getByRole('button', { name: /regenerate/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stop/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more options/i })).toBeInTheDocument();
  });
});
