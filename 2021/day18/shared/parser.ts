import { SnailfishHomework, SnailfishLeaf, SnailfishNumber } from './snailfish';

interface ParseCursor {
  readonly text: string;
  index: number;
}

function expectChar(cursor: ParseCursor, expected: string): void {
  const actual = cursor.text[cursor.index];
  if (actual !== expected) {
    throw new SyntaxError(
      `Expected '${expected}' at position ${cursor.index}, got '${actual ?? 'EOF'}'`,
    );
  }
  cursor.index += 1;
}

function parseNumberLeaf(cursor: ParseCursor, depth: number, out: SnailfishLeaf[]): void {
  const start = cursor.index;
  while (cursor.index < cursor.text.length) {
    const ch = cursor.text[cursor.index]!;
    if (ch < '0' || ch > '9') break;
    cursor.index += 1;
  }
  if (cursor.index === start) {
    throw new SyntaxError(`Expected non-negative integer at position ${start}`);
  }
  const value = Number(cursor.text.slice(start, cursor.index));
  if (!Number.isSafeInteger(value)) {
    throw new SyntaxError(`Snailfish number value exceeds safe integer range at ${start}`);
  }
  out.push(new SnailfishLeaf(value, depth));
}

function parseElement(cursor: ParseCursor, depth: number, out: SnailfishLeaf[]): void {
  if (cursor.text[cursor.index] === '[') {
    parsePair(cursor, depth + 1, out);
    return;
  }
  parseNumberLeaf(cursor, depth, out);
}

function parsePair(cursor: ParseCursor, depth: number, out: SnailfishLeaf[]): void {
  expectChar(cursor, '[');
  parseElement(cursor, depth, out);
  expectChar(cursor, ',');
  parseElement(cursor, depth, out);
  expectChar(cursor, ']');
}

/** Parses a single bracketed `[L,R]` snailfish number into flat depth-encoded leaves. */
export function parseSnailfishNumber(raw: string): SnailfishNumber {
  const text = raw.trim();
  const cursor: ParseCursor = { text, index: 0 };
  const leaves: SnailfishLeaf[] = [];
  parsePair(cursor, 1, leaves);
  if (cursor.index !== text.length) {
    throw new SyntaxError(`Unexpected trailing input at position ${cursor.index}`);
  }
  return new SnailfishNumber(leaves);
}

/** Parses non-empty homework lines into a validated `SnailfishHomework` list. */
export function parseSnailfishHomework(raw: string): SnailfishHomework {
  const numbers: SnailfishNumber[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      numbers.push(parseSnailfishNumber(trimmed));
    }
  }
  return new SnailfishHomework(numbers);
}
