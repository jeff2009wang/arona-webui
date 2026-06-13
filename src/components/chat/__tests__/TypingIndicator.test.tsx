import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TypingIndicator } from '../TypingIndicator';

describe('TypingIndicator', () => {
  it('renders three typing dots', () => {
    render(<TypingIndicator />);
    const dots = screen.getAllByTestId('typing-dot');
    expect(dots).toHaveLength(3);
  });
});
