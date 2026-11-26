import { describe, expect, it } from 'vitest';
import { parseReports, Report } from './report';

describe('Report', () => {
  it('defensively copies, freezes, normalizes -0, and rejects unsafe ints', () => {
    const raw = [-0, 2, 4];
    const report = new Report(raw);
    raw[0] = 99;
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.levels)).toBe(true);
    expect(report.levels).toEqual([0, 2, 4]);
    expect(Object.is(report.levels[0], 0)).toBe(true);
    expect(report.length).toBe(3);
    expect(() => new Report([1, 2.5])).toThrow(RangeError);
  });

  it('treats 0- and 1-level reports as safe with null trend', () => {
    for (const levels of [[], [5]]) {
      const report = new Report(levels);
      expect(report.trend).toBeNull();
      expect(report.firstFailure()).toBeNull();
      expect(report.isSafe).toBe(true);
    }
  });

  it('detects safe ascending/descending reports and classifies first failures from index 0', () => {
    expect(new Report([1, 3, 6, 7, 9]).isSafe).toBe(true);
    expect(new Report([7, 6, 4, 2, 1]).trend).toBe(-1);
    expect(new Report([7, 6, 4, 2, 1]).isSafe).toBe(true);

    const flatStart = new Report([4, 4, 5]).firstFailure();
    expect(flatStart).toMatchObject({ index: 0, prev: 4, next: 4, reason: 'flat', delta: 0 });

    const jumpStart = new Report([1, 6, 7]).firstFailure();
    expect(jumpStart).toMatchObject({ index: 0, prev: 1, next: 6, reason: 'jump', delta: 5 });

    const reversal = new Report([1, 3, 2, 4, 5]).firstFailure();
    expect(reversal).toMatchObject({ index: 1, prev: 3, next: 2, reason: 'reversal', delta: -1 });

    const flatMid = new Report([8, 6, 4, 4, 1]).firstFailure();
    expect(flatMid).toMatchObject({ index: 2, prev: 4, next: 4, reason: 'flat', delta: 0 });

    const jumpDesc = new Report([9, 7, 6, 2, 1]).firstFailure();
    expect(jumpDesc).toMatchObject({ index: 2, prev: 6, next: 2, reason: 'jump', delta: -4 });
  });
});

describe('parseReports', () => {
  it('parses LF/CRLF lines, trims outer whitespace, and normalizes -0', () => {
    const reports = parseReports('\n  -0   2  4 \r\n 7 6 4 2 1\r\n');
    expect(Object.isFrozen(reports)).toBe(true);
    expect(reports).toHaveLength(2);
    expect(reports[0]!.levels).toEqual([0, 2, 4]);
    expect(Object.is(reports[0]!.levels[0], 0)).toBe(true);
    expect(reports[1]!.levels).toEqual([7, 6, 4, 2, 1]);
  });

  it('rejects empty input, blank middle lines, invalid tokens, and unsafe integers', () => {
    expect(() => parseReports('   \n\t  ')).toThrow(Error);
    expect(() => parseReports('1 2\n\n3 4')).toThrow(/Line 2/);
    expect(() => parseReports('1 2\n3 a 5')).toThrow(/Line 2/);
    expect(() => parseReports('1 +2')).toThrow(/Line 1/);
    expect(() => parseReports('1 2.5')).toThrow(/Line 1/);
    expect(() => parseReports('1 9007199254740992')).toThrow(RangeError);
  });
});
