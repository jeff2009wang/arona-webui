import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatComposer } from '../ChatComposer';

describe('ChatComposer', () => {
  it('renders textarea', () => {
    render(<ChatComposer onSend={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: /message input/i })).toBeInTheDocument();
  });

  it('sends trimmed message on Enter', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);

    const textarea = screen.getByRole('textbox', { name: /message input/i });
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith('Hello world');
  });

  it('calls onSend with trimmed text', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);

    const textarea = screen.getByRole('textbox', { name: /message input/i });
    fireEvent.change(textarea, { target: { value: '  trimmed message  ' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSend).toHaveBeenCalledWith('trimmed message');
  });

  it('disables send button when empty', () => {
    render(<ChatComposer onSend={vi.fn()} />);

    const sendButton = screen.getByRole('button', { name: /send message/i });
    expect(sendButton).toBeDisabled();
  });

  it('supports Shift+Enter without sending', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);

    const textarea = screen.getByRole('textbox', { name: /message input/i });
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('sends message when send button is clicked', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} />);

    const textarea = screen.getByRole('textbox', { name: /message input/i });
    fireEvent.change(textarea, { target: { value: 'Click send' } });

    const sendButton = screen.getByRole('button', { name: /send message/i });
    fireEvent.click(sendButton);

    expect(onSend).toHaveBeenCalledTimes(1);
    expect(onSend).toHaveBeenCalledWith('Click send');
  });

  it('does not send when disabled', () => {
    const onSend = vi.fn();
    render(<ChatComposer onSend={onSend} disabled />);

    const textarea = screen.getByRole('textbox', { name: /message input/i });
    fireEvent.change(textarea, { target: { value: 'Hello world' } });
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false });

    expect(onSend).not.toHaveBeenCalled();
  });

  it('has accessible labels on textarea and send button', () => {
    render(<ChatComposer onSend={vi.fn()} />);

    expect(screen.getByRole('textbox', { name: /message input/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument();
  });
});
