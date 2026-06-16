import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import { ThinkingBubble } from '../ThinkingBubble';

describe('ThinkingBubble', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders active thinking state with loading dots', () => {
    render(<ThinkingBubble isActive />);
    expect(screen.getByText('思考中...')).toBeInTheDocument();
    expect(screen.getAllByTestId('thinking-dot')).toHaveLength(3);
    expect(screen.queryByTestId('reasoning-content')).toBeNull();
  });

  it('renders reasoning content in the same bubble', () => {
    render(<ThinkingBubble isActive reasoning="step one" />);
    expect(screen.getByText('思考中...')).toBeInTheDocument();
    expect(screen.getByTestId('reasoning-content')).toHaveTextContent('step one');
  });

  it('toggles reasoning content when collapsed', async () => {
    render(<ThinkingBubble reasoning="step one" />);
    expect(screen.getByText('思考过程')).toBeInTheDocument();
    expect(screen.queryByTestId('reasoning-content')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /展开思考过程/i }));
    expect(screen.getByTestId('reasoning-content')).toHaveTextContent('step one');

    fireEvent.click(screen.getByRole('button', { name: /收起思考过程/i }));
    // Wait for AnimatePresence exit animation
    await new Promise((r) => setTimeout(r, 250));
    expect(screen.queryByTestId('reasoning-content')).toBeNull();
  });
});
