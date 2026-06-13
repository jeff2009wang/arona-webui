import { describe, it, expect, beforeEach, vi } from 'vitest';
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

  it('returns null when localStorage throws on get', () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => { throw new Error('quota'); };
    expect(localStorageAdapter.getItem('x')).toBeNull();
    Storage.prototype.getItem = original;
  });

  it('warns when localStorage throws on set', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error('quota'); };
    localStorageAdapter.setItem('x', 'y');
    expect(warnSpy).toHaveBeenCalled();
    Storage.prototype.setItem = original;
    warnSpy.mockRestore();
  });

  it('does not throw when localStorage throws on remove', () => {
    const original = Storage.prototype.removeItem;
    Storage.prototype.removeItem = () => { throw new Error('quota'); };
    expect(() => localStorageAdapter.removeItem('x')).not.toThrow();
    Storage.prototype.removeItem = original;
  });
});
