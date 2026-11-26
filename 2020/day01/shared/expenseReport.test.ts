import { describe, expect, it } from 'vitest';
import { compareExpenseEntries, ExpenseReport, parseExpenseReport } from './expenseReport';

describe('compareExpenseEntries', () => {
  it('orders by ascending value and breaks ties by originalIndex', () => {
    const a = { originalIndex: 3, value: 100 };
    const b = { originalIndex: 1, value: 200 };
    const c = { originalIndex: 0, value: 100 };
    expect(compareExpenseEntries(a, b)).toBeLessThan(0);
    expect(compareExpenseEntries(b, a)).toBeGreaterThan(0);
    expect(compareExpenseEntries(c, a)).toBeLessThan(0);
    expect(compareExpenseEntries(a, c)).toBeGreaterThan(0);
    expect(compareExpenseEntries(a, a)).toBe(0);
  });
});

describe('ExpenseReport', () => {
  it('freezes entries, exposes size, and returns a fresh sorted array without mutating input', () => {
    const source = [
      { originalIndex: 0, value: 1721 },
      { originalIndex: 1, value: 979 },
      { originalIndex: 2, value: 366 },
    ];
    const report = new ExpenseReport(source);
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.entries)).toBe(true);
    expect(Object.isFrozen(report.entries[0])).toBe(true);
    expect(report.size).toBe(3);

    const sorted = report.sortedEntries();
    expect(Object.isFrozen(sorted)).toBe(true);
    expect(sorted.map((entry) => entry.value)).toEqual([366, 979, 1721]);
    expect(report.entries.map((entry) => entry.value)).toEqual([1721, 979, 366]);
    expect(sorted).not.toBe(report.sortedEntries());
  });

  it('rejects empty reports and invalid entry values or indices', () => {
    expect(() => new ExpenseReport([])).toThrow(RangeError);
    expect(() => new ExpenseReport([{ originalIndex: -1, value: 10 }])).toThrow(RangeError);
    expect(() => new ExpenseReport([{ originalIndex: 1.5, value: 10 }])).toThrow(RangeError);
    expect(() => new ExpenseReport([{ originalIndex: 0, value: -5 }])).toThrow(RangeError);
    expect(() => new ExpenseReport([{ originalIndex: 0, value: 12.25 }])).toThrow(RangeError);
    expect(() => new ExpenseReport([{ originalIndex: 0, value: Number.MAX_SAFE_INTEGER + 1 }])).toThrow(RangeError);
  });
});

describe('parseExpenseReport', () => {
  it('parses whitespace-padded lines with CRLF/LF and blank lines', () => {
    const report = parseExpenseReport('  1721 \r\n\n  979\n0\r\n  366  \n');
    expect(report.entries).toEqual([
      { originalIndex: 0, value: 1721 },
      { originalIndex: 1, value: 979 },
      { originalIndex: 2, value: 0 },
      { originalIndex: 3, value: 366 },
    ]);
  });

  it('rejects empty input, non-digit tokens, and unsafe integers', () => {
    expect(() => parseExpenseReport('  \n\r\n ')).toThrow(RangeError);
    expect(() => parseExpenseReport('1721\n-10')).toThrow(SyntaxError);
    expect(() => parseExpenseReport('1721\nabc')).toThrow(SyntaxError);
    expect(() => parseExpenseReport('9007199254740993')).toThrow(RangeError);
  });
});
