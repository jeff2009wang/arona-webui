import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ChatComposer } from '../ChatComposer';

describe('ChatComposer', () => {
  it('renders input and send button', () => {
    render(<ChatComposer onSend={vi.fn()} disabled={false} />);
    expect(screen.getByRole('textbox', { name: /message input/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
  });

  it('calls onSend with text and empty images on Enter', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} disabled={false} />);
    const input = screen.getByRole('textbox', { name: /message input/i });
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).toHaveBeenCalledWith('Hello', []);
  });

  it('does not call onSend when disabled', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} disabled={true} />);
    const input = screen.getByRole('textbox', { name: /message input/i });
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onSend).not.toHaveBeenCalled();
  });

  it('renders image attach button', () => {
    render(<ChatComposer onSend={vi.fn()} disabled={false} />);
    expect(screen.getByRole('button', { name: /attach image/i })).toBeInTheDocument();
  });
});
