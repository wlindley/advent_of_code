import { describe, expect, it } from 'vitest';
import type { ExtrapolationStrategy } from './strategy';
import {
  OasisReport,
  parseHistoryLine,
  parseOasisReport,
  SIGNED_INT_PATTERN,
} from './parser';

const FORWARD: ExtrapolationStrategy = {
  direction: 'forward',
  label: 'Forward',
  operatorSymbol: '+',
  anchorOf: (layer) => layer[layer.length - 1]!,
  combine: (anchor, below) => anchor + below,
};

describe('SIGNED_INT_PATTERN and parseHistoryLine', () => {
  it('parses whitespace-separated signed and huge bigints', () => {
    expect(SIGNED_INT_PATTERN.test('-42')).toBe(true);
    const row = parseHistoryLine('  0   -3 900719925474099312345  ', 1);
    expect(row).toEqual([0n, -3n, 900719925474099312345n]);
    expect(Object.isFrozen(row)).toBe(true);
  });

  it('rejects empty lines and malformed integer tokens with line numbers', () => {
    expect(() => parseHistoryLine('   ', 4)).toThrow(/line 4/i);
    expect(() => parseHistoryLine('1 +5 3', 2)).toThrow(/line 2.*\+5/);
    expect(() => parseHistoryLine('1 2.5 3', 3)).toThrow(/line 3.*2\.5/);
    expect(() => parseHistoryLine('1 1e3 3', 5)).toThrow(/line 5.*1e3/);
    expect(() => parseHistoryLine('1 --1 3', 6)).toThrow(/line 6.*--1/);
  });
});

describe('OasisReport and parseOasisReport', () => {
  it('parses multi-line reports with CRLF and blank lines', () => {
    const raw = '\r\n0 3 6 9 12 15\r\n\r\n1 3 6 10 15 21\n10 13 16 21 30 45\r\n';
    const report = parseOasisReport(raw);
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.histories)).toBe(true);
    expect(report.historyCount).toBe(3);
    expect(report.extrapolateSum(FORWARD)).toBe(114n);
  });

  it('rejects empty report input or invalid OasisReport construction', () => {
    expect(() => parseOasisReport('   \n\r\n  ')).toThrow(/at least one history/i);
    expect(() => new OasisReport([])).toThrow(/at least one history/i);
    expect(() => new OasisReport([[]])).toThrow(/non-empty/i);
  });
});
