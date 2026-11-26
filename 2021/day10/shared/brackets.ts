/** Opening bracket characters permitted in navigation subsystem lines. */
export type OpenBracket = '(' | '[' | '{' | '<';

/** Closing bracket characters permitted in navigation subsystem lines. */
export type CloseBracket = ')' | ']' | '}' | '>';

/** Any valid syntax chunk delimiter character. */
export type BracketChar = OpenBracket | CloseBracket;

/** Ordered list of closing bracket characters for tabular tally displays. */
export const CLOSE_BRACKETS: readonly CloseBracket[] = Object.freeze([')', ']', '}', '>']);

/** Maps each opening bracket to its required matching closer. */
export const MATCHING_CLOSE: Readonly<Record<OpenBracket, CloseBracket>> = Object.freeze({
  '(': ')',
  '[': ']',
  '{': '}',
  '<': '>',
});

/** Illegal closer penalty points for Part 1 syntax corruption scoring. */
export const CORRUPTION_POINTS: Readonly<Record<CloseBracket, bigint>> = Object.freeze({
  ')': 3n,
  ']': 57n,
  '}': 1197n,
  '>': 25137n,
});

/** Closing-sequence base-5 digit weights for Part 2 autocomplete scoring. */
export const AUTOCOMPLETE_POINTS: Readonly<Record<CloseBracket, bigint>> = Object.freeze({
  ')': 1n,
  ']': 2n,
  '}': 3n,
  '>': 4n,
});

/** Base-5 multiplier applied before adding each closing bracket's autocomplete points. */
export const AUTOCOMPLETE_MULTIPLIER = 5n;

const OPEN_BRACKET_SET: ReadonlySet<string> = new Set<string>(['(', '[', '{', '<']);
const CLOSE_BRACKET_SET: ReadonlySet<string> = new Set<string>(CLOSE_BRACKETS);

/** Prototype-safe guard verifying whether `ch` is one of `(`, `[`, `{`, `<`. */
export function isOpenBracket(ch: string): ch is OpenBracket {
  return OPEN_BRACKET_SET.has(ch);
}

/** Prototype-safe guard verifying whether `ch` is one of `)`, `]`, `}`, `>`. */
export function isCloseBracket(ch: string): ch is CloseBracket {
  return CLOSE_BRACKET_SET.has(ch);
}
