/**
 * Safely extracts a human-readable message from an unknown thrown value.
 * Catch-clause variables are typed `unknown` under strict TypeScript, so
 * `err.message` cannot be accessed directly — use this helper instead.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Safely extracts the stack trace from an unknown thrown value.
 */
export function getErrorStack(err: unknown): string | undefined {
  return err instanceof Error ? err.stack : undefined;
}
