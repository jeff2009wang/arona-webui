import { describe, it, expect } from 'vitest';
import { generateSessionTitle, generateSessionSummary } from '../sessionMeta';
import type { Message } from '../../types';

const makeMessage = (role: Message['role'], content: string): Message => ({
  id: `${role}-${content.slice(0, 10)}`,
  role,
  content,
  createdAt: Date.now(),
});

describe('generateSessionTitle', () => {
  it('returns "新对话" for empty messages', () => {
    expect(generateSessionTitle([])).toBe('新对话');
  });

  it('does not use short greetings as title', () => {
    const messages = [makeMessage('user', '你好')];
    expect(generateSessionTitle(messages)).not.toBe('你好');
    expect(generateSessionTitle(messages)).toBe('未命名会话');
  });

  it('detects xgboost topic', () => {
    const messages = [makeMessage('user', '和我讲讲 xgboost 的原理')];
    expect(generateSessionTitle(messages)).toBe('XGBoost 讲解');
  });

  it('detects docker topic', () => {
    const messages = [makeMessage('user', 'Docker 启动不了怎么办')];
    expect(generateSessionTitle(messages)).toBe('Docker 问题排查');
  });

  it('detects nginx topic', () => {
    const messages = [makeMessage('user', '帮我写 nginx 反代配置')];
    expect(generateSessionTitle(messages)).toBe('Nginx 配置');
  });

  it('detects weather topic', () => {
    const messages = [makeMessage('user', '上海今天天气如何')];
    expect(generateSessionTitle(messages)).toBe('天气查询');
  });

  it('detects HermesAgent style topic', () => {
    const messages = [makeMessage('user', '设计 HermesAgent 的 Plana 风格教学')];
    expect(generateSessionTitle(messages)).toBe('Agent 风格教学');
  });

  it('uses the first meaningful user message when no keyword matches', () => {
    const messages = [
      makeMessage('user', '你好'),
      makeMessage('user', '数据库 CPU 怎么选比较合理'),
    ];
    const title = generateSessionTitle(messages);
    expect(title).toContain('数据库');
    expect(title.length).toBeLessThanOrEqual(16);
  });

  it('truncates long titles', () => {
    const messages = [makeMessage('user', '这是一个非常长的消息内容用来测试标题截断逻辑是否正确工作')];
    const title = generateSessionTitle(messages);
    expect(title.length).toBeLessThanOrEqual(16);
    expect(title.endsWith('…')).toBe(true);
  });

  it('ignores the generic greeting and reads the second user message', () => {
    const messages = [
      makeMessage('user', '在吗'),
      makeMessage('assistant', '在的，有什么可以帮您？'),
      makeMessage('user', '帮我写一段 Python 脚本处理 CSV'),
    ];
    const title = generateSessionTitle(messages);
    expect(title).not.toBe('在吗');
    expect(title.includes('Python') || title.includes('脚本') || title.includes('代码生成')).toBe(true);
  });
});

describe('generateSessionSummary', () => {
  it('returns "No messages" for empty messages', () => {
    expect(generateSessionSummary([])).toBe('No messages');
  });

  it('summarizes xgboost discussion', () => {
    const messages = [makeMessage('user', '和我讲讲 xgboost')];
    expect(generateSessionSummary(messages)).toBe('讨论 XGBoost 的原理和适用场景');
  });

  it('summarizes docker troubleshooting', () => {
    const messages = [makeMessage('user', 'Docker 无法启动')];
    expect(generateSessionSummary(messages)).toBe('排查 Docker 无法启动或运行的问题');
  });

  it('summarizes nginx config', () => {
    const messages = [makeMessage('user', '帮我写 nginx 反代配置')];
    expect(generateSessionSummary(messages)).toBe('配置 Nginx 反向代理或服务器');
  });

  it('summarizes weather query', () => {
    const messages = [makeMessage('user', '上海今天天气如何')];
    expect(generateSessionSummary(messages)).toBe('查询指定城市当前或未来天气');
  });

  it('does not show empty summary for generic greetings', () => {
    const messages = [makeMessage('user', '你好')];
    const summary = generateSessionSummary(messages);
    expect(summary).not.toBe('');
    expect(summary).not.toBe('No messages');
  });

  it('keeps summary length reasonable', () => {
    const messages = [makeMessage('user', '帮我看看这个数据库 CPU 选择的问题')];
    const summary = generateSessionSummary(messages);
    expect(summary.length).toBeGreaterThanOrEqual(8);
    expect(summary.length).toBeLessThanOrEqual(40);
  });
});
