import { describe, expect, it } from 'vitest';
import { HomeworkProgram, parseHomework } from './parser';
import { ADD_BEFORE_MUL_POLICY, EQUAL_PRECEDENCE_POLICY } from './policies';

describe('day18 Pratt parser', () => {
  it('parses single and multi-line expressions with CRLF, blank lines, and dynamic totalSteps', () => {
    const raw = '\r\n  1 + 2 * 3  \r\n\r\n((42))\r\n2 * 3 + (4 * 5)\r\n';
    const part1 = parseHomework(raw, EQUAL_PRECEDENCE_POLICY);

    expect(part1).toBeInstanceOf(HomeworkProgram);
    expect(Object.isFrozen(part1)).toBe(true);
    expect(Object.isFrozen(part1.expressions)).toBe(true);
    expect(part1.expressions.map((expr) => expr.lineNumber)).toEqual([2, 4, 5]);
    expect(part1.expressions.map((expr) => expr.source)).toEqual(['1 + 2 * 3', '((42))', '2 * 3 + (4 * 5)']);
    expect(part1.totalSteps).toBe(2 + 1 + 3);
    expect(part1.evaluateSum()).toBe(9n + 42n + 26n);

    const part2 = parseHomework('1 + 2 * 3 + 4 * 5 + 6', ADD_BEFORE_MUL_POLICY);
    expect(part2.evaluateSum()).toBe(231n);
  });

  it('rejects all 16 syntax error cases with SyntaxError and accurate line/column', () => {
    const cases: readonly [string, RegExp][] = [
      ['', /at least one expression/],
      ['  \r\n\t\n  ', /at least one expression/],
      ['1 ? 2', /Unexpected character '\?' at line 1, column 3/],
      ['+ 1', /line 1, column 1, got '\+'/],
      ['* 1', /line 1, column 1, got '\*'/],
      ['1 +', /Unexpected end of expression on line 1/],
      ['1 + * 2', /line 1, column 5, got '\*'/],
      ['()', /line 1, column 2, got '\)'/],
      [') 1', /line 1, column 1, got '\)'/],
      ['1 + 2 )', /Unexpected token '\)' at line 1, column 7/],
      ['1 2', /Unexpected token '2' at line 1, column 3/],
      ['1 (2)', /Unexpected token '\(' at line 1, column 3/],
      ['(1) 2', /Unexpected token '2' at line 1, column 5/],
      ['(1 + 2', /Unclosed '\(' at line 1, column 1/],
      ['(1 + 2 3)', /Expected '\)' to close '\(' from column 1 at line 1, column 8, got '3'/],
      ['(1 + 2 (3))', /Expected '\)' to close '\(' from column 1 at line 1, column 8, got '\('/],
    ];

    expect(cases).toHaveLength(16);
    for (const [input, pattern] of cases) {
      expect(() => parseHomework(input, EQUAL_PRECEDENCE_POLICY)).toThrowError(SyntaxError);
      expect(() => parseHomework(input, EQUAL_PRECEDENCE_POLICY)).toThrowError(pattern);
    }
  });
});
