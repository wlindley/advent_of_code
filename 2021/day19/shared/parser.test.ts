import { describe, expect, it } from 'vitest';
import { parseScannerReports } from './parser';

describe('parseScannerReports', () => {
  it('parses multiple scanner sections with CRLF and surrounding whitespace', () => {
    const raw = [
      '  --- scanner 0 ---  ',
      '0,2,0',
      '-1,4,-2',
      '',
      '--- scanner 1 ---',
      '10,-20,30',
    ].join('\r\n');

    const reports = parseScannerReports(raw);
    expect(Object.isFrozen(reports)).toBe(true);
    expect(reports).toHaveLength(2);
    expect(reports[0]!.id).toBe(0);
    expect(reports[0]!.beaconCount).toBe(2);
    expect(reports[0]!.beacons[1]!.format()).toBe('(-1, 4, -2)');
    expect(reports[1]!.id).toBe(1);
    expect(reports[1]!.beacons[0]!.format()).toBe('(10, -20, 30)');
  });

  it('rejects empty input, duplicate IDs, coords before header, empty sections, and malformed lines', () => {
    expect(() => parseScannerReports('   \n\n  ')).toThrow(SyntaxError);
    expect(() => parseScannerReports('1,2,3\n--- scanner 0 ---\n4,5,6')).toThrow(SyntaxError);
    expect(() => parseScannerReports('--- scanner 0 ---\n--- scanner 1 ---\n1,2,3')).toThrow(SyntaxError);
    expect(() => parseScannerReports('--- scanner 0 ---\n1,2,3\n--- scanner 1 ---')).toThrow(SyntaxError);
    expect(() => parseScannerReports('--- scanner 0 ---\n1,2,3\n--- scanner 0 ---\n4,5,6')).toThrow(SyntaxError);
    expect(() => parseScannerReports('--- scanner 0 ---\n1,2')).toThrow(SyntaxError);
    expect(() => parseScannerReports('--- scanner 0 ---\n1,2,x')).toThrow(SyntaxError);
  });
});
