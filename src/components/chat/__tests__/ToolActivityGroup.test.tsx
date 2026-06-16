import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ToolActivityGroup } from '../ToolActivityGroup';
import type { ToolCallNode } from '../../../types';

const makeTool = (overrides: Partial<ToolCallNode> = {}): ToolCallNode => ({
  type: 'tool_call',
  id: 'tc1',
  name: 'web_search',
  arguments: { query: 'test' },
  status: 'running',
  startedAt: Date.now(),
  ...overrides,
});

describe('ToolActivityGroup', () => {
  it('renders collapsed system activity card', () => {
    render(
      <ToolActivityGroup
        toolCalls={[makeTool(), makeTool({ id: 'tc2', name: 'web_extract' })]}
        persona="arona"
      />
    );
    expect(screen.getByText(/系统活动/i)).toBeInTheDocument();
    expect(screen.getByText(/正在执行 2 个工具调用/i)).toBeInTheDocument();
    expect(screen.getByText(/Web Search/i)).toBeInTheDocument();
    expect(screen.getByText(/Page Extract/i)).toBeInTheDocument();
  });

  it('maps tool names to friendly names', () => {
    render(
      <ToolActivityGroup
        toolCalls={[
          makeTool({ name: 'browser_navigate' }),
          makeTool({ name: 'browser_console' }),
          makeTool({ name: 'file_read' }),
          makeTool({ name: 'code_execute' }),
        ]}
        persona="arona"
      />
    );
    expect(screen.getByText(/Browser Open/i)).toBeInTheDocument();
    expect(screen.getByText(/Console Check/i)).toBeInTheDocument();
    expect(screen.getByText(/File Read/i)).toBeInTheDocument();
    expect(screen.getByText(/Code Run/i)).toBeInTheDocument();
  });

  it('expands to show timeline on click', () => {
    render(
      <ToolActivityGroup
        toolCalls={[makeTool({ status: 'success', result: 'found 3 results', finishedAt: Date.now() + 1200 })]}
        persona="arona"
      />
    );
    expect(screen.queryByText(/found 3 results/i)).toBeNull();
    fireEvent.click(screen.getByText(/系统活动/i));
    expect(screen.getByText(/found 3 results/i)).toBeInTheDocument();
  });

  it('does not render empty preview', () => {
    render(
      <ToolActivityGroup
        toolCalls={[makeTool({ arguments: { preview: '' }, status: 'success', finishedAt: Date.now() })]}
        persona="arona"
      />
    );
    fireEvent.click(screen.getByText(/系统活动/i));
    expect(screen.queryByText(/\{ "preview": "" \}/i)).toBeNull();
  });

  it('shows error state when any tool failed', () => {
    render(
      <ToolActivityGroup
        toolCalls={[makeTool({ status: 'error', result: '403 Forbidden', finishedAt: Date.now() })]}
        persona="arona"
      />
    );
    expect(screen.getByText(/Error/i)).toBeInTheDocument();
    fireEvent.click(screen.getByText(/系统活动/i));
    expect(screen.getByText(/Failed/i)).toBeInTheDocument();
    expect(screen.getByText(/403 Forbidden/i)).toBeInTheDocument();
  });
});
