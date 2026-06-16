import type { Message } from '../types';

const FALLBACK_TITLE = '未命名会话';
const EMPTY_TITLE = '新对话';
const EMPTY_SUMMARY = 'No messages';

const GENERIC_GREETINGS = new Set([
  '你好',
  '在吗',
  '在么',
  '在？',
  '在?',
  '你是谁',
  '你是',
  '帮我看看',
  '帮我看下',
  '帮我',
  '继续',
  '继续吧',
  'hello',
  'hi',
  'hey',
  '你好啊',
  '您好',
  '在不在',
]);

const isGenericGreeting = (text: string): boolean => {
  const trimmed = text.trim().toLowerCase().replace(/[？?。！!，,.\\s]+$/g, '');
  if (GENERIC_GREETINGS.has(trimmed)) return true;
  // Very short (<=4 chars) messages are usually greetings / filler.
  if (trimmed.length <= 4 && !/[a-z0-9]/i.test(trimmed)) return true;
  return false;
};

const collectText = (messages: Message[], maxChars = 600): string => {
  return messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => {
      if (Array.isArray(m.content)) {
        return m.content
          .filter((n) => n.type === 'text')
          .map((n) => (n as { content: string }).content)
          .join('')
          .trim();
      }
      return m.content.trim();
    })
    .filter(Boolean)
    .join('\n')
    .slice(0, maxChars)
    .toLowerCase();
};

const detectTopic = (text: string): { title: string; summary: string } | null => {
  const rules: { test: RegExp; title: string; summary: string }[] = [
    { test: /\bxgboost\b/, title: 'XGBoost 讲解', summary: '讨论 XGBoost 的原理和适用场景' },
    { test: /\bdocker\b/, title: 'Docker 问题排查', summary: '排查 Docker 无法启动或运行的问题' },
    { test: /\bnginx\b/, title: 'Nginx 配置', summary: '配置 Nginx 反向代理或服务器' },
    { test: /天气/, title: '天气查询', summary: '查询指定城市当前或未来天气' },
    { test: /数据库/, title: '数据库硬件选择', summary: '讨论数据库服务器硬件选型' },
    { test: /\bcpu\b|中央处理器|处理器/, title: 'CPU 选择', summary: '讨论 CPU 选型与性能对比' },
    { test: /hermesagent/, title: 'Agent 风格教学', summary: '设计 HermesAgent 的回复风格教学' },
    { test: /风格/, title: '风格设计', summary: '讨论回复风格与角色设定' },
  ];

  for (const rule of rules) {
    if (rule.test.test(text)) {
      return { title: rule.title, summary: rule.summary };
    }
  }
  return null;
};

const extractFirstMeaningfulUserMessage = (messages: Message[]): string | null => {
  for (const m of messages) {
    if (m.role !== 'user') continue;
    const text = Array.isArray(m.content)
      ? m.content.filter((n) => n.type === 'text').map((n) => (n as { content: string }).content).join('')
      : m.content;
    if (!text.trim()) continue;
    if (isGenericGreeting(text)) continue;
    return text.trim();
  }
  return null;
};

const extractSubjectFromText = (text: string): string => {
  // Remove common prefixes and punctuation.
  const cleaned = text
    .replace(/^(请|帮我|给我|我想|我要|问一下|请问|能否|能不能|可以|可不可以|你|能不能够)?[，,\s]*/i, '')
    .replace(/[？?。！!，,.\n]+$/, '')
    .trim();

  // Truncate at first sentence or punctuation to keep it noun-like.
  const firstSentence = cleaned.split(/[。！!?\n]/)[0].trim();
  return firstSentence || cleaned;
};

const truncateTitle = (title: string, max = 16): string => {
  if (title.length <= max) return title;
  // Try to cut at a natural boundary.
  const cutAt = title.slice(0, max).lastIndexOf(' ');
  if (cutAt > max * 0.6) return title.slice(0, cutAt) + '…';
  return title.slice(0, max - 1) + '…';
};

export function generateSessionTitle(messages: Message[]): string {
  if (messages.length === 0) return EMPTY_TITLE;

  const fullText = collectText(messages, 1000);
  const topic = detectTopic(fullText);
  if (topic) return truncateTitle(topic.title, 16);

  const meaningful = extractFirstMeaningfulUserMessage(messages);
  if (meaningful) {
    const subject = extractSubjectFromText(meaningful);
    // If the first meaningful message is already descriptive enough, use it.
    if (subject.length >= 5 && subject.length <= 16) return subject;
    if (subject.length > 16) return truncateTitle(subject, 16);
    // For medium-length subjects, append a generic suffix if possible.
    const suffix = fullText.includes('报错') || fullText.includes('错误') || fullText.includes('失败')
      ? '问题排查'
      : fullText.includes('配置') || fullText.includes('设置')
      ? '配置'
      : fullText.includes('写') || fullText.includes('生成') || fullText.includes('代码')
      ? '代码生成'
      : '讨论';
    return truncateTitle(`${subject}${suffix}`, 16);
  }

  // Fallback: try to extract from assistant's first reply.
  const firstAssistant = messages.find((m) => m.role === 'assistant');
  if (firstAssistant?.content) {
    const text = Array.isArray(firstAssistant.content)
      ? firstAssistant.content.filter((n) => n.type === 'text').map((n) => (n as { content: string }).content).join('')
      : firstAssistant.content;
    const subject = extractSubjectFromText(text.trim());
    if (subject.length >= 5) return truncateTitle(subject, 16);
  }

  return FALLBACK_TITLE;
}

export function generateSessionSummary(messages: Message[]): string {
  if (messages.length === 0) return EMPTY_SUMMARY;

  const fullText = collectText(messages, 1000);
  const topic = detectTopic(fullText);
  if (topic) return topic.summary;

  const meaningful = extractFirstMeaningfulUserMessage(messages);
  if (meaningful) {
    const subject = extractSubjectFromText(meaningful);
    if (subject.length >= 5) {
      if (fullText.includes('报错') || fullText.includes('错误') || fullText.includes('失败') || fullText.includes('无法')) {
        return `排查 ${subject} 的问题`;
      }
      if (fullText.includes('配置') || fullText.includes('设置')) {
        return `配置 ${subject}`;
      }
      if (fullText.includes('写') || fullText.includes('生成') || fullText.includes('代码')) {
        return `生成 ${subject} 相关代码`;
      }
      return `讨论 ${subject}`;
    }
  }

  const firstAssistant = messages.find((m) => m.role === 'assistant');
  if (firstAssistant?.content) {
    const text = Array.isArray(firstAssistant.content)
      ? firstAssistant.content.filter((n) => n.type === 'text').map((n) => (n as { content: string }).content).join('')
      : firstAssistant.content;
    const trimmed = text.trim();
    if (trimmed) {
      return `查看 assistant 关于 ${extractSubjectFromText(trimmed)} 的回复`;
    }
  }

  return '继续当前对话';
}

export interface SessionMetaUpdate {
  title?: string;
  summary?: string;
  titleGenerated?: boolean;
  summaryGenerated?: boolean;
}

export function buildSessionMeta(messages: Message[]): Required<SessionMetaUpdate> {
  return {
    title: generateSessionTitle(messages),
    summary: generateSessionSummary(messages),
    titleGenerated: true,
    summaryGenerated: true,
  };
}
