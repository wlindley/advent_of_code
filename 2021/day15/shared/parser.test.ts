import { describe, expect, it } from 'vitest';
import { parseRiskGrid } from './parser';

describe('parseRiskGrid', () => {
  it('parses rectangular 1..9 digit grids with CRLF or LF and outer whitespace', () => {
    const grid = parseRiskGrid('  \r\n123\r\n456\r\n789\n  ');
    expect(grid.rows).toBe(3);
    expect(grid.cols).toBe(3);
    expect(grid.riskAt(0, 0)).toBe(1);
    expect(grid.riskAt(1, 2)).toBe(6);
    expect(grid.riskAt(2, 1)).toBe(8);
  });

  it('rejects empty inputs, interior blank lines, ragged rows, 0, and non-digits', () => {
    expect(() => parseRiskGrid('')).toThrow('empty');
    expect(() => parseRiskGrid('   \n\t  ')).toThrow('empty');
    expect(() => parseRiskGrid('12\n\n34')).toThrow('blank');
    expect(() => parseRiskGrid('12\n3')).toThrow('Ragged');
    expect(() => parseRiskGrid('12\n30')).toThrow(RangeError);
    expect(() => parseRiskGrid('12\n3a')).toThrow(RangeError);
    expect(() => parseRiskGrid('12\n3/')).toThrow(RangeError);
  });
});
