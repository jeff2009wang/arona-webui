import { describe, it, expect, beforeEach } from 'vitest';
import { localStorageAdapter } from '../storage';

describe('localStorageAdapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves items', () => {
    localStorageAdapter.setItem('test-key', '{"value":1}');
    expect(localStorageAdapter.getItem('test-key')).toBe('{"value":1}');
  });

  it('returns null for missing keys', () => {
    expect(localStorageAdapter.getItem('missing')).toBeNull();
  });

  it('removes items', () => {
    localStorageAdapter.setItem('remove-key', 'x');
    localStorageAdapter.removeItem('remove-key');
    expect(localStorageAdapter.getItem('remove-key')).toBeNull();
  });
});
