import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatHeader } from '../ChatHeader';

describe('ChatHeader', () => {
  it('renders character name', () => {
    render(<ChatHeader name="Arona" status="Online" avatar="/assets/placeholders/avatar-arona.svg" onStop={vi.fn()} isStreaming={false} model="gpt-4o" />);
    expect(screen.getByText('Arona')).toBeInTheDocument();
  });

  it('renders model tag', () => {
    render(<ChatHeader name="Arona" status="Online" avatar="/assets/placeholders/avatar-arona.svg" onStop={vi.fn()} isStreaming={false} model="gpt-4o-mini" />);
    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument();
  });

  it('calls onStop when stop button clicked during streaming', () => {
    const onStop = vi.fn();
    render(<ChatHeader name="Arona" status="Online" avatar="/assets/placeholders/avatar-arona.svg" onStop={onStop} isStreaming={true} model="gpt-4o" />);
    fireEvent.click(screen.getByRole('button', { name: /stop/i }));
    expect(onStop).toHaveBeenCalledOnce();
  });

  it('does not show stop button when not streaming', () => {
    render(<ChatHeader name="Arona" status="Online" avatar="/assets/placeholders/avatar-arona.svg" onStop={vi.fn()} isStreaming={false} model="gpt-4o" />);
    expect(screen.queryByRole('button', { name: /stop/i })).toBeNull();
  });
});
