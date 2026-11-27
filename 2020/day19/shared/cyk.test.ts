import { describe, expect, it } from 'vitest';
import { compileCnf } from './cnf';
import { countMatchingMessages, fillCykChart, matchesMessage } from './cyk';
import { Grammar, type GrammarRule } from './grammar';
import { parseMonsterMessages } from './parser';

const EXAMPLE_INPUT = [
  '0: 4 1 5',
  '1: 2 3 | 3 2',
  '2: 4 4 | 5 5',
  '3: 4 5 | 5 4',
  '4: "a"',
  '5: "b"',
  '',
  'ababbb',
  'bababa',
  'abbbab',
  'aaabbb',
  'aaaabbb',
].join('\n');

describe('CYK chart and matching', () => {
  it('matches official example messages and exposes chart cell queries', () => {
    const parsed = parseMonsterMessages(EXAMPLE_INPUT);
    const cnf = compileCnf(parsed.grammar);

    const chart = fillCykChart(cnf, 'ababbb');
    expect(chart.length).toBe(6);
    expect(chart.has(0, 6, cnf.startSymbol)).toBe(true);
    expect(chart.hasAnyOriginal(0, 6)).toBe(true);
    expect(chart.hasAnyOriginal(0, 2)).toBe(true);
    expect(chart.hasAnyOriginal(0, 3)).toBe(false);
    expect(Object.isFrozen(chart)).toBe(true);

    expect(countMatchingMessages(cnf, parsed.messages)).toBe(2);
  });

  it('reuses provided buffer when large enough and allocates when omitted or too small', () => {
    const parsed = parseMonsterMessages(EXAMPLE_INPUT);
    const cnf = compileCnf(parsed.grammar);

    const smallBuf = new Uint32Array(1);
    expect(matchesMessage(cnf, 'ababbb', smallBuf)).toBe(true);

    const bigBuf = new Uint32Array(128);
    expect(matchesMessage(cnf, 'abbbab', bigBuf)).toBe(true);
    expect(matchesMessage(cnf, 'bababa', bigBuf)).toBe(false);
    expect(matchesMessage(cnf, 'az', bigBuf)).toBe(false);
  });

  it('handles bit-31 symbols and multi-word hasAnyOriginal safely', () => {
    // 33 original rules: sym 31 (bit 31 of word 0) and sym 32 (bit 0 of word 1).
    const rules: GrammarRule[] = [
      { kind: 'sequence', id: 0, alternatives: [[31, 32]] },
    ];
    for (let id = 1; id <= 30; id += 1) {
      rules.push({ kind: 'terminal', id, symbol: 'b' });
    }
    rules.push({ kind: 'terminal', id: 31, symbol: 'a' });
    rules.push({ kind: 'terminal', id: 32, symbol: 'a' });

    const cnf = compileCnf(new Grammar(rules));
    const chart = fillCykChart(cnf, 'aa');
    expect(chart.has(0, 1, 31)).toBe(true);
    expect(chart.has(1, 1, 32)).toBe(true);
    expect(chart.has(0, 2, cnf.startSymbol)).toBe(true);
    expect(chart.hasAnyOriginal(0, 2)).toBe(true);

    // Also test a span with no matching rules across multiple words (e.g., 'ab' where only 'a' rules exist at pos 0, none for 'c' if we have 'b' vs unmatched pair).
    const chartMiss = fillCykChart(cnf, 'ba');
    expect(chartMiss.has(0, 2, cnf.startSymbol)).toBe(false);
    expect(chartMiss.hasAnyOriginal(0, 2)).toBe(false);
    expect(chartMiss.hasAnyOriginal(1, 1)).toBe(true);
  });
});
