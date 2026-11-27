import { describe, expect, it } from 'vitest';
import { compileCnf } from './cnf';
import { parseMonsterMessages } from './parser';
import { LOOP_PATCHED_GRAMMAR_POLICY } from './policies';
import { analyzeMessage } from './spans';

const PART1_EXAMPLE = [
  '0: 4 1 5',
  '1: 2 3 | 3 2',
  '2: 4 4 | 5 5',
  '3: 4 5 | 5 4',
  '4: "a"',
  '5: "b"',
  '',
  'ababbb',
  'bababa',
].join('\n');

const PART2_MINI = [
  '0: 8 11',
  '8: 42',
  '11: 42 31',
  '42: "a"',
  '31: "b"',
  '',
  'aab',
  'aba',
].join('\n');

describe('analyzeMessage', () => {
  it('reconstructs unfolded witness spans and triangle rows for a matched message', () => {
    const parsed = parseMonsterMessages(PART1_EXAMPLE);
    const cnf = compileCnf(parsed.grammar);
    const analysis = analyzeMessage(cnf, 'ababbb');

    expect(analysis.matched).toBe(true);
    expect(analysis.message).toBe('ababbb');
    expect(Object.isFrozen(analysis)).toBe(true);
    expect(Object.isFrozen(analysis.spans)).toBe(true);
    expect(Object.isFrozen(analysis.triangleRows)).toBe(true);

    // Unfolds synthetic k=3 node in rule 0: children 4, 1, 5 all appear at depth 1.
    expect(analysis.spans[0]).toEqual({ ruleId: 0, start: 0, len: 6, depth: 0, role: 'rule' });
    const depth1 = analysis.spans.filter((s) => s.depth === 1);
    expect(depth1.map((s) => [s.ruleId, s.start, s.len])).toEqual([
      [4, 0, 1],
      [1, 1, 4],
      [5, 5, 1],
    ]);

    expect(analysis.triangleRows.length).toBe(6);
    expect(analysis.triangleRows[5]).toBe('0');
    expect(analysis.triangleRows[0]).toBe('wwwwww');
    expect(analysis.triangleRows[1]).toBe('rwrwr');
    expect(analysis.triangleRows[2]).toContain('.');
  });

  it('produces empty spans and marks sub-rule matches for an unmatched message', () => {
    const parsed = parseMonsterMessages(PART1_EXAMPLE);
    const cnf = compileCnf(parsed.grammar);
    const analysis = analyzeMessage(cnf, 'bababa');

    expect(analysis.matched).toBe(false);
    expect(analysis.spans).toEqual([]);
    expect(analysis.triangleRows[5]).toBe('.');
    expect(analysis.triangleRows[0]).toBe('rrrrrr');
  });

  it('tags rule42 and rule31 roles in spans and triangleRows', () => {
    const parsed = parseMonsterMessages(PART2_MINI);
    const patched = LOOP_PATCHED_GRAMMAR_POLICY.apply(parsed.grammar);
    const cnf = compileCnf(patched);

    const matched = analyzeMessage(cnf, 'aab');
    expect(matched.matched).toBe(true);
    expect(matched.spans.some((s) => s.role === 'rule42' && s.ruleId === 42)).toBe(true);
    expect(matched.spans.some((s) => s.role === 'rule31' && s.ruleId === 31)).toBe(true);
    expect(matched.triangleRows[0]).toBe('443');
    expect(matched.triangleRows[2]).toBe('0');
  });
});
