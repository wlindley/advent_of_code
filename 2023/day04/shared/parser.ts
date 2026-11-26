import { Scratchcard } from './scratchcard';

const CARD_LINE_RE = /^Card\s+(\d+):\s*(.+)$/;
const DIGITS_RE = /^\d+$/;

/** Parses a whitespace-separated segment of unsigned integer tokens into a frozen array. */
export function parseNumberList(segment: string, label: string): readonly number[] {
  const trimmed = segment.trim();
  if (trimmed.length === 0) {
    throw new SyntaxError(`${label} must not be empty`);
  }
  const tokens = trimmed.split(/\s+/);
  const numbers: number[] = [];
  for (const token of tokens) {
    if (!DIGITS_RE.test(token)) {
      throw new SyntaxError(`Invalid integer token "${token}" in ${label}`);
    }
    numbers.push(Number(token));
  }
  return Object.freeze(numbers);
}

/** Parses one `Card <id>: <winning> | <owned>` line into an immutable `Scratchcard`. */
export function parseScratchcard(line: string): Scratchcard {
  const match = CARD_LINE_RE.exec(line.trim());
  if (!match) {
    throw new SyntaxError(`Malformed scratchcard line: "${line}"`);
  }
  const sides = match[2]!.split('|');
  if (sides.length !== 2) {
    throw new SyntaxError(`Scratchcard must contain exactly one '|' separator: "${line}"`);
  }
  const id = Number(match[1]!);
  const winningNumbers = parseNumberList(sides[0]!, 'winningNumbers');
  const ownedNumbers = parseNumberList(sides[1]!, 'ownedNumbers');
  return new Scratchcard(id, winningNumbers, ownedNumbers);
}

/** Parses multiline scratchcard text (LF or CRLF) into a frozen `Scratchcard` array. */
export function parseScratchcards(raw: string): readonly Scratchcard[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new SyntaxError('Scratchcard input must not be empty');
  }
  return Object.freeze(trimmed.split(/\r?\n/).map(parseScratchcard));
}
