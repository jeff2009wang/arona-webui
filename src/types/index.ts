export type Persona = 'arona' | 'plana';

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: 'running' | 'success' | 'error';
  startedAt: number;
  finishedAt?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  reasoning?: string; // streaming reasoning / thinking content
  createdAt: number;
  toolCalls?: ToolCall[];
  status?: 'sending' | 'sent' | 'error';
  images?: string[]; // base64 data URLs, not persisted to localStorage
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
  backgroundOpacity: number; // 0–1, scales theme overlay alpha
  backgroundBlur: number;    // px, applied to background layer only
  streamEnabled?: boolean;
  localBackgroundPath?: string;
  localAvatarPath?: string;
  autoSummarize?: boolean;
}
