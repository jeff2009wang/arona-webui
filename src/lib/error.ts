import { LLMError } from './llm';

/**
 * Extract a human-readable message from any thrown value.
 *
 * Handles:
 * - Error / LLMError instances
 * - string rejections
 * - plain objects with a `message` property
 * - common API wrappers like `{ error: string }` or `{ error: { message } }`
 * - other values are stringified so they can be inspected instead of showing
 *   a generic "Unknown error" string.
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof LLMError) return error.message;
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  if (error === null || error === undefined) return 'Unknown error';

  if (typeof error === 'object') {
    const obj = error as Record<string, unknown>;
    if (typeof obj.message === 'string' && obj.message) {
      return obj.message;
    }
    if (typeof obj.error === 'string' && obj.error) {
      return obj.error;
    }
    if (obj.error && typeof obj.error === 'object') {
      const inner = obj.error as Record<string, unknown>;
      if (typeof inner.message === 'string' && inner.message) {
        return inner.message;
      }
    }
    try {
      return `Unknown error: ${JSON.stringify(error)}`;
    } catch {
      return `Unknown error: ${String(error)}`;
    }
  }

  return `Unknown error: ${String(error)}`;
}
