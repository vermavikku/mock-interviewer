// Robust JSON parser for AI (Gemini) responses that may contain:
// - Markdown code fences
// - Single-line and multi-line comments
// - Trailing commas before closing braces or brackets
// - Raw unescaped control characters (newlines, tabs) inside string literals
// - Invalid or unescaped backslashes
// - Unbalanced or truncated braces / brackets
// - Partial object-level recovery fallback

// Removes JS line and block comments outside quoted strings
function stripComments(input: string): string {
  let result = '';
  let inString = false;
  let quoteChar = '"';
  let isEscaped = false;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    const next = input[i + 1];

    if (inString) {
      result += c;
      if (isEscaped) {
        isEscaped = false;
      } else if (c === '\\') {
        isEscaped = true;
      } else if (c === quoteChar) {
        inString = false;
      }
      continue;
    }

    if (c === '"' || c === "'") {
      inString = true;
      quoteChar = c;
      result += c;
      continue;
    }

    // Line comment
    if (c === '/' && next === '/') {
      const newlineIdx = input.indexOf('\n', i + 2);
      if (newlineIdx === -1) break;
      i = newlineIdx;
      result += '\n';
      continue;
    }

    // Block comment
    if (c === '/' && next === '*') {
      const closeIdx = input.indexOf('*/', i + 2);
      if (closeIdx === -1) break;
      i = closeIdx + 1;
      continue;
    }

    result += c;
  }

  return result;
}

// Removes trailing commas before } and ] outside string literals
function stripTrailingCommas(input: string): string {
  let result = '';
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];

    if (inString) {
      result += c;
      if (isEscaped) {
        isEscaped = false;
      } else if (c === '\\') {
        isEscaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }

    if (c === '"') {
      inString = true;
      result += c;
      continue;
    }

    if (c === ',') {
      let j = i + 1;
      while (j < input.length && /\s/.test(input[j])) {
        j++;
      }
      if (j < input.length && (input[j] === '}' || input[j] === ']')) {
        continue;
      }
    }

    result += c;
  }

  return result;
}

// Repairs unescaped control chars and invalid backslashes inside string literals
function repairEscapes(input: string): string {
  const VALID_ESCAPES = ['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u'];
  let repaired = '';
  let inString = false;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];

    if (inString) {
      if (c === '\\') {
        const next = input[i + 1];
        if (next !== undefined && VALID_ESCAPES.includes(next)) {
          repaired += c + next;
          i++;
          continue;
        }
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
        if (c === '\n') repaired += '\\n';
        else if (c === '\r') repaired += '\\r';
        else if (c === '\t') repaired += '\\t';
        else repaired += '\\u' + code.toString(16).padStart(4, '0');
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
        continue;
      }
      repaired += c;
    }
  }

  return repaired;
}

// Automatically balances open brackets and braces if JSON was truncated
function balanceBrackets(input: string): string {
  const stack: string[] = [];
  let inString = false;
  let isEscaped = false;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (c === '\\') {
        isEscaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }

    if (c === '"') {
      inString = true;
      continue;
    }

    if (c === '{') stack.push('}');
    else if (c === '[') stack.push(']');
    else if (c === '}' || c === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === c) {
        stack.pop();
      }
    }
  }

  let balanced = input;
  if (inString) {
    balanced += '"';
  }
  while (stack.length > 0) {
    balanced += stack.pop();
  }

  return balanced;
}

// Attempts to extract and parse individual JSON objects from an array string
function extractQuestionObjects(input: string): any[] {
  const objects: any[] = [];
  let depth = 0;
  let inString = false;
  let isEscaped = false;
  let startIdx = -1;

  for (let i = 0; i < input.length; i++) {
    const c = input[i];

    if (inString) {
      if (isEscaped) {
        isEscaped = false;
      } else if (c === '\\') {
        isEscaped = true;
      } else if (c === '"') {
        inString = false;
      }
      continue;
    }

    if (c === '"') {
      inString = true;
      continue;
    }

    if (c === '{') {
      if (depth === 0) {
        startIdx = i;
      }
      depth++;
    } else if (c === '}') {
      depth--;
      if (depth === 0 && startIdx !== -1) {
        const objStr = input.substring(startIdx, i + 1);
        try {
          const parsedObj = JSON.parse(objStr);
          if (parsedObj && typeof parsedObj === 'object') {
            objects.push(parsedObj);
          }
        } catch {
          try {
            const repairedObj = repairEscapes(stripTrailingCommas(stripComments(objStr)));
            const parsedObj = JSON.parse(repairedObj);
            if (parsedObj && typeof parsedObj === 'object') {
              objects.push(parsedObj);
            }
          } catch {
            // Ignore unrecoverable chunk
          }
        }
        startIdx = -1;
      }
    }
  }

  return objects;
}

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

  let boundedText = text;
  if (arrayStart !== -1 && (objStart === -1 || arrayStart < objStart)) {
    // Array is the outermost wrapper
    boundedText = arrayEnd > arrayStart ? text.substring(arrayStart, arrayEnd + 1) : text.substring(arrayStart);
  } else if (objStart !== -1) {
    // Object is the outermost wrapper
    boundedText = objEnd > objStart ? text.substring(objStart, objEnd + 1) : text.substring(objStart);
  }

  // Pass 1: Direct JSON.parse
  try {
    return JSON.parse(boundedText) as T;
  } catch {
    // Continue to repair pipeline
  }

  // Pass 2: Clean comments -> Clean trailing commas -> Repair escapes -> Balance brackets
  let repaired = stripComments(boundedText);
  repaired = stripTrailingCommas(repaired);
  repaired = repairEscapes(repaired);
  repaired = balanceBrackets(repaired);

  try {
    return JSON.parse(repaired) as T;
  } catch {
    // Continue to chunk recovery
  }

  // Pass 3: Extract individual objects if expecting an array
  const recoveredObjects = extractQuestionObjects(text);
  if (recoveredObjects.length > 0) {
    return recoveredObjects as unknown as T;
  }

  // If everything fails, throw actionable error
  try {
    return JSON.parse(repaired) as T;
  } catch (err) {
    throw new Error(
      `parseAiJson: failed to parse AI JSON after repair — ${getErrorMessageSafe(err)}. Snippet: ${text.slice(0, 200)}`,
    );
  }
}

function getErrorMessageSafe(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
