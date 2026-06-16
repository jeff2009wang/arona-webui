import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from '../error';
import { LLMError } from '../llm';

describe('extractErrorMessage', () => {
  it('returns the message from an LLMError', () => {
    expect(extractErrorMessage(new LLMError('API key invalid', 401))).toBe('API key invalid');
  });

  it('returns the message from a generic Error', () => {
    expect(extractErrorMessage(new Error('Network failure'))).toBe('Network failure');
  });

  it('returns string rejections as-is', () => {
    expect(extractErrorMessage('connection refused')).toBe('connection refused');
  });

  it('extracts message from a plain object', () => {
    expect(extractErrorMessage({ message: 'something went wrong' })).toBe('something went wrong');
  });

  it('extracts a string error wrapper', () => {
    expect(extractErrorMessage({ error: 'rate limited' })).toBe('rate limited');
  });

  it('extracts message from a nested error wrapper', () => {
    expect(extractErrorMessage({ error: { message: 'Invalid model' } })).toBe('Invalid model');
  });

  it('stringifies other objects so they can be inspected', () => {
    expect(extractErrorMessage({ code: 'ECONNREFUSED' })).toBe(
      'Unknown error: {"code":"ECONNREFUSED"}'
    );
  });

  it('falls back to "Unknown error" for null and undefined', () => {
    expect(extractErrorMessage(null)).toBe('Unknown error');
    expect(extractErrorMessage(undefined)).toBe('Unknown error');
  });

  it('stringifies primitive values', () => {
    expect(extractErrorMessage(42)).toBe('Unknown error: 42');
  });
});
