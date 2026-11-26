import { describe, expect, it } from 'vitest';
import {
  AUTOCOMPLETE_MULTIPLIER,
  AUTOCOMPLETE_POINTS,
  CLOSE_BRACKETS,
  CORRUPTION_POINTS,
  isCloseBracket,
  isOpenBracket,
  MATCHING_CLOSE,
} from './brackets';

describe('brackets', () => {
  it('defines frozen lookup tables and constants', () => {
    expect(Object.isFrozen(CLOSE_BRACKETS)).toBe(true);
    expect(Object.isFrozen(MATCHING_CLOSE)).toBe(true);
    expect(Object.isFrozen(CORRUPTION_POINTS)).toBe(true);
    expect(Object.isFrozen(AUTOCOMPLETE_POINTS)).toBe(true);

    expect(CLOSE_BRACKETS).toEqual([')', ']', '}', '>']);
    expect(MATCHING_CLOSE).toEqual({ '(': ')', '[': ']', '{': '}', '<': '>' });
    expect(CORRUPTION_POINTS).toEqual({ ')': 3n, ']': 57n, '}': 1197n, '>': 25137n });
    expect(AUTOCOMPLETE_POINTS).toEqual({ ')': 1n, ']': 2n, '}': 3n, '>': 4n });
    expect(AUTOCOMPLETE_MULTIPLIER).toBe(5n);
  });

  it('recognizes open brackets and rejects closers, invalid chars, and Object.prototype keys', () => {
    expect(isOpenBracket('(')).toBe(true);
    expect(isOpenBracket('[')).toBe(true);
    expect(isOpenBracket('{')).toBe(true);
    expect(isOpenBracket('<')).toBe(true);

    expect(isOpenBracket(')')).toBe(false);
    expect(isOpenBracket('x')).toBe(false);
    expect(isOpenBracket('')).toBe(false);
    expect(isOpenBracket('toString')).toBe(false);
    expect(isOpenBracket('constructor')).toBe(false);
  });

  it('recognizes close brackets and rejects openers, invalid chars, and Object.prototype keys', () => {
    expect(isCloseBracket(')')).toBe(true);
    expect(isCloseBracket(']')).toBe(true);
    expect(isCloseBracket('}')).toBe(true);
    expect(isCloseBracket('>')).toBe(true);

    expect(isCloseBracket('(')).toBe(false);
    expect(isCloseBracket('x')).toBe(false);
    expect(isCloseBracket('')).toBe(false);
    expect(isCloseBracket('hasOwnProperty')).toBe(false);
    expect(isCloseBracket('__proto__')).toBe(false);
  });
});
