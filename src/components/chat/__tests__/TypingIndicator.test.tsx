import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TypingIndicator } from '../TypingIndicator';

describe('TypingIndicator', () => {
  it('renders three bounce dots', () => {
    render(<TypingIndicator />);

    const dots = screen.getAllByText((_, element) => {
      return element?.className.includes('animate-bounce') ?? false;
    });
    expect(dots).toHaveLength(3);
  });
});
