export type Persona = 'arona' | 'plana';

export interface TextNode { type: 'text'; content: string; }
export interface ReasoningNode { type: 'reasoning'; content: string; }
export interface ToolCallNode {
  type: 'tool_call';
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'running' | 'success' | 'error';
  startedAt: number;
  finishedAt?: number;
}
export type MessageNode = TextNode | ReasoningNode | ToolCallNode;

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string | MessageNode[];
  createdAt: number;
  status?: 'sending' | 'sent' | 'error';
  images?: string[];
}

export interface Session {
  id: string;
  title: string;
  summary: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  systemPrompt?: string;
  titleGenerated: boolean;
  summaryGenerated: boolean;
}

export interface Settings {
  baseUrl: string;
  apiKey: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  persona: Persona;
  enableCgBackground: boolean;
  backgroundOpacity: number;
  backgroundBlur: number;
  streamEnabled?: boolean;
  localBackgroundPath?: string;
  localAvatarPath?: string;
  autoSummarize?: boolean;
}
