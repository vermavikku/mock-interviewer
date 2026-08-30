/**
 * Robust JSON parser for AI (Gemini) responses that may contain code, regexes,
 * or other content with backslashes / raw control characters that break strict
 * JSON.parse.
 *
 * Strategy:
 *  1. Strip markdown fences (```json / ```)
 *  2. Extract the outermost JSON value (first `[`/`{` ... matching last `]`/`}`)
 *  3. Try JSON.parse directly
 *  4. On failure, run a string-aware repair scanner:
 *     - Inside a string: escape raw control chars as \uXXXX; if a `\` is
 *       followed by a character that is NOT a valid JSON escape (e.g. `\s`
 *       from a regex), insert a second `\` so it becomes a literal backslash.
 *     - Outside a string: drop stray `\` characters (fixes
 *       "Unexpected token '\' is not valid JSON").
 *  5. JSON.parse the repaired text.
 */
export function parseAiJson<T = any>(raw: string): T {
  if (!raw || typeof raw !== 'string') {
    throw new Error('parseAiJson: empty or non-string AI response');
  }

  // 1. Strip markdown code fences
  let text = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  // 2. Extract the outermost JSON object/array
  const arrayStart = text.indexOf('[');
  const arrayEnd = text.lastIndexOf(']');
  const objStart = text.indexOf('{');
  const objEnd = text.lastIndexOf('}');

  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    text = text.substring(arrayStart, arrayEnd + 1);
  } else if (objStart !== -1 && objEnd > objStart) {
    text = text.substring(objStart, objEnd + 1);
  }

  // 3. Fast path: already valid JSON
  try {
    return JSON.parse(text) as T;
  } catch {
    /* fall through to repair */
  }

  // 4. String-aware repair scan
  const VALID_ESCAPES = ['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'];
  let repaired = '';
  let inString = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];

    if (inString) {
      if (c === '\\') {
        const next = text[i + 1];
        if (next !== undefined && VALID_ESCAPES.includes(next)) {
          // Already-valid escape sequence — copy both chars verbatim
          repaired += c + next;
          i++;
          continue;
        }
        // Invalid escape (e.g. `\s`, or a trailing `\`) — escape the backslash
        // so it becomes a literal `\` inside the string value.
        repaired += '\\\\';
        continue;
      }
      if (c === '"') {
        inString = false;
        repaired += c;
        continue;
      }
      const code = c.charCodeAt(0);
      if (code < 0x20) {
        // Raw control char inside a string (real newline / tab) — escape it
        repaired += '\\u' + code.toString(16).padStart(4, '0');
        continue;
      }
      repaired += c;
    } else {
      if (c === '"') {
        inString = true;
        repaired += c;
        continue;
      }
      if (c === '\\') {
        // Stray backslash outside any string — invalid JSON token, drop it
        continue;
      }
      repaired += c;
    }
  }

  try {
    return JSON.parse(repaired) as T;
  } catch (err) {
    throw new Error(
      `parseAiJson: failed to parse AI JSON after repair — ${getErrorMessageSafe(err)}. Snippet: ${text.slice(0, 200)}`,
    );
  }
}

/** Local-safe error message extraction (avoids importing error.util here). */
function getErrorMessageSafe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
