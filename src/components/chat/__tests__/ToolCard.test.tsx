import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ToolCard } from '../ToolCard';
import type { ToolCall } from '../../../types';

const mockToolCall: ToolCall = {
  id: 'tool-1',
  name: 'search_web',
  arguments: { query: 'Blue Archive characters' },
  result: 'Found 5 results',
  status: 'success',
  startedAt: Date.now(),
  finishedAt: Date.now(),
};

const runningToolCall: ToolCall = {
  id: 'tool-2',
  name: 'fetch_data',
  arguments: { url: 'https://example.com' },
  status: 'running',
  startedAt: Date.now(),
};

const errorToolCall: ToolCall = {
  id: 'tool-3',
  name: 'compute',
  arguments: { expr: '1/0' },
  result: 'Division by zero',
  status: 'error',
  startedAt: Date.now(),
  finishedAt: Date.now(),
};

describe('ToolCard', () => {
  it('renders tool name and status', () => {
    render(<ToolCard toolCall={mockToolCall} />);

    expect(screen.getByText(/Tool Call · search_web/i)).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('toggles expanded details when the button is clicked', () => {
    render(<ToolCard toolCall={mockToolCall} />);

    const detailsButton = screen.getByRole('button', { name: /show details/i });
    expect(detailsButton).toBeInTheDocument();

    fireEvent.click(detailsButton);

    const collapseButton = screen.getByRole('button', { name: /hide details/i });
    expect(collapseButton).toBeInTheDocument();

    fireEvent.click(collapseButton);

    expect(screen.getByRole('button', { name: /show details/i })).toBeInTheDocument();
  });

  it('shows arguments when expanded', () => {
    render(<ToolCard toolCall={mockToolCall} />);

    const detailsButton = screen.getByRole('button', { name: /show details/i });
    fireEvent.click(detailsButton);

    expect(screen.getByText(/"query": "Blue Archive characters"/)).toBeInTheDocument();
  });

  it('renders running status with pulse indicator', () => {
    render(<ToolCard toolCall={runningToolCall} />);

    expect(screen.getByText('running')).toBeInTheDocument();
  });

  it('renders error status with red color', () => {
    render(<ToolCard toolCall={errorToolCall} />);

    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('has accessible label on details toggle button', () => {
    render(<ToolCard toolCall={mockToolCall} />);

    expect(screen.getByRole('button', { name: /show details/i })).toBeInTheDocument();
  });
});
