import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ToolCard } from '../ToolCard';
import type { ToolCall } from '../../../types';

const base: ToolCall = {
  id: 'tc1',
  name: 'web_search',
  arguments: { query: 'test' },
  status: 'running',
  startedAt: Date.now(),
};

describe('ToolCard', () => {
  it('shows spinner and TOOL CALL label when running', () => {
    render(<ToolCard toolCall={base} />);
    expect(screen.getByText(/TOOL CALL/i)).toBeInTheDocument();
    expect(screen.getByText('web_search')).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument(); // spinner
  });

  it('shows checkmark and TOOL RESULT when success', () => {
    render(<ToolCard toolCall={{ ...base, status: 'success', result: 'found 3 results', finishedAt: Date.now() }} />);
    expect(screen.getByText(/TOOL RESULT/i)).toBeInTheDocument();
    expect(screen.getByText(/found 3 results/i)).toBeInTheDocument();
  });

  it('shows error icon and TOOL ERROR when error', () => {
    render(<ToolCard toolCall={{ ...base, status: 'error', result: '403 Forbidden', finishedAt: Date.now() }} />);
    expect(screen.getByText(/TOOL ERROR/i)).toBeInTheDocument();
    expect(screen.getByText(/403 Forbidden/i)).toBeInTheDocument();
  });

  it('toggles expanded details on click', () => {
    render(<ToolCard toolCall={{ ...base, status: 'success', result: { key: 'value' }, finishedAt: Date.now() }} />);
    expect(screen.queryByText(/key/)).toBeNull();
    fireEvent.click(screen.getByText(/展开详情/i));
    expect(screen.getByText(/"key"/)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/收起/i));
    expect(screen.queryByText(/"key"/)).toBeNull();
  });
});
