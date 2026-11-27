import { describe, expect, it } from 'vitest';
import { tokenizeLine } from './lexer';

describe('day18 lexer', () => {
  it('tokenizes operators, parentheses, whitespace, and multi-digit BigInts with 1-based columns', () => {
    const tokens = tokenizeLine('  (12 + 345) * 9007199254740993\t', 3);
    expect(Object.isFrozen(tokens)).toBe(true);
    expect(tokens.every((token) => Object.isFrozen(token))).toBe(true);
    expect(tokens).toEqual([
      { kind: 'paren', paren: '(', column: 3 },
      { kind: 'number', value: 12n, column: 4 },
      { kind: 'operator', operator: '+', column: 7 },
      { kind: 'number', value: 345n, column: 9 },
      { kind: 'paren', paren: ')', column: 12 },
      { kind: 'operator', operator: '*', column: 14 },
      { kind: 'number', value: 9007199254740993n, column: 16 },
    ]);
  });

  it('returns an empty frozen array for whitespace-only lines', () => {
    const tokens = tokenizeLine('   \t ', 1);
    expect(tokens).toEqual([]);
    expect(Object.isFrozen(tokens)).toBe(true);
  });

  it('rejects unexpected characters below and above ASCII digits with line and column', () => {
    expect(() => tokenizeLine('1 - 2', 2)).toThrowError(SyntaxError);
    expect(() => tokenizeLine('1 - 2', 2)).toThrow("Unexpected character '-' at line 2, column 3");
    expect(() => tokenizeLine('1 + x', 4)).toThrow("Unexpected character 'x' at line 4, column 5");
  });
});
