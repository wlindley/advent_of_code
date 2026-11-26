import { describe, expect, it } from 'vitest';
import { BitTally, DiagnosticReport, parseDiagnosticReport } from './report';

const EXAMPLE_ROWS = [
  '00100',
  '11110',
  '10110',
  '10111',
  '10101',
  '01111',
  '00111',
  '11100',
  '10000',
  '11001',
  '00010',
  '01010',
];

describe('BitTally', () => {
  it('stores ones/zeros frozen and computes total and onesRatio dynamically', () => {
    const tally = new BitTally(7, 5);
    expect(Object.isFrozen(tally)).toBe(true);
    expect(tally.ones).toBe(7);
    expect(tally.zeros).toBe(5);
    expect(tally.total).toBe(12);
    expect(tally.onesRatio).toBeCloseTo(7 / 12, 12);
  });

  it('rejects negative, non-integer, and zero-total bit counts with RangeError', () => {
    expect(() => new BitTally(-1, 2)).toThrow(RangeError);
    expect(() => new BitTally(2, -1)).toThrow(RangeError);
    expect(() => new BitTally(1.5, 2)).toThrow(RangeError);
    expect(() => new BitTally(2, 0.5)).toThrow(RangeError);
    expect(() => new BitTally(0, 0)).toThrow(RangeError);
  });
});

describe('DiagnosticReport', () => {
  it('constructs frozen defensive copy with dynamic rowCount and bitWidth', () => {
    const source = ['1010', '0110'];
    const report = new DiagnosticReport(source);
    source[0] = '0000';

    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.rows)).toBe(true);
    expect(report.rowCount).toBe(2);
    expect(report.bitWidth).toBe(4);
    expect(report.rowAt(0)).toBe('1010');
    expect(report.valueAt(0)).toBe(0b1010n);
    expect(report.valueAt(1)).toBe(0b0110n);
  });

  it('validates emptiness, binary digits, uniform width, and row bounds', () => {
    expect(() => new DiagnosticReport([])).toThrow(RangeError);
    expect(() => new DiagnosticReport([''])).toThrow(SyntaxError);
    expect(() => new DiagnosticReport(['101', '10a'])).toThrow(SyntaxError);
    expect(() => new DiagnosticReport(['101', '10'])).toThrow(RangeError);

    const report = new DiagnosticReport(['101']);
    expect(() => report.rowAt(-1)).toThrow(RangeError);
    expect(() => report.rowAt(1)).toThrow(RangeError);
    expect(() => report.rowAt(0.5)).toThrow(RangeError);
    expect(() => report.valueAt(1)).toThrow(RangeError);
  });

  it('counts bits across all rows or an explicit row-index subset', () => {
    const report = new DiagnosticReport(EXAMPLE_ROWS);
    const col0 = report.countBitsAtColumn(0);
    expect(col0.ones).toBe(7);
    expect(col0.zeros).toBe(5);

    const subset = report.countBitsAtColumn(1, [0, 1, 2, 5]);
    expect(subset.ones).toBe(2);
    expect(subset.zeros).toBe(2);

    expect(() => report.countBitsAtColumn(-1)).toThrow(RangeError);
    expect(() => report.countBitsAtColumn(5)).toThrow(RangeError);
    expect(() => report.countBitsAtColumn(1.5)).toThrow(RangeError);
    expect(() => report.countBitsAtColumn(0, [])).toThrow(RangeError);
    expect(() => report.countBitsAtColumn(0, [99])).toThrow(RangeError);
  });

  it('filters row indices by bit value at a column and validates arguments', () => {
    const report = new DiagnosticReport(EXAMPLE_ROWS);
    const allIndices = EXAMPLE_ROWS.map((_, idx) => idx);
    const onesCol0 = report.filterRowsByBit(0, '1', allIndices);
    expect(Object.isFrozen(onesCol0)).toBe(true);
    expect(onesCol0).toEqual([1, 2, 3, 4, 7, 8, 9]);

    const zerosCol1 = report.filterRowsByBit(1, '0', onesCol0);
    expect(zerosCol1).toEqual([2, 3, 4, 8]);

    expect(() => report.filterRowsByBit(5, '1', [0])).toThrow(RangeError);
    expect(() => report.filterRowsByBit(0, '1', [-1])).toThrow(RangeError);
  });
});

describe('parseDiagnosticReport', () => {
  it('parses CRLF/LF text with surrounding whitespace and blank lines', () => {
    const raw = '  00100 \r\n\r\n 11110\n  10110  \n';
    const report = parseDiagnosticReport(raw);
    expect(report.rowCount).toBe(3);
    expect(report.bitWidth).toBe(5);
    expect(report.rowAt(2)).toBe('10110');
  });

  it('propagates DiagnosticReport validation errors for empty or invalid text', () => {
    expect(() => parseDiagnosticReport('   \n\t\r\n')).toThrow(RangeError);
    expect(() => parseDiagnosticReport('101\n102')).toThrow(SyntaxError);
    expect(() => parseDiagnosticReport('101\n10')).toThrow(RangeError);
  });
});
