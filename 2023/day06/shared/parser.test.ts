import { describe, expect, it } from 'vitest';
import { extractRaceRows, parseRaceColumns, parseUnsignedBigInt } from './parser';

describe('extractRaceRows', () => {
  it('extracts trimmed Time and Distance bodies across CRLF and blank lines', () => {
    const raw = '\r\nTime:   7  15   30\r\n\r\nDistance:  9  40  200  \r\n';
    const rows = extractRaceRows(raw);
    expect(rows).toEqual({ timeBody: '7  15   30', distanceBody: '9  40  200' });
    expect(Object.isFrozen(rows)).toBe(true);
  });

  it('rejects empty input', () => {
    expect(() => extractRaceRows('   \n  ')).toThrow(SyntaxError);
  });

  it('rejects input with fewer or more than 2 non-empty lines', () => {
    expect(() => extractRaceRows('Time: 7 15')).toThrow(SyntaxError);
    expect(() => extractRaceRows('Time: 7\nDistance: 9\nExtra: 1')).toThrow(SyntaxError);
  });

  it('rejects missing or empty Time header', () => {
    expect(() => extractRaceRows('Clock: 7\nDistance: 9')).toThrow(SyntaxError);
    expect(() => extractRaceRows('Time:   \nDistance: 9')).toThrow(SyntaxError);
  });

  it('rejects missing or empty Distance header', () => {
    expect(() => extractRaceRows('Time: 7\nLength: 9')).toThrow(SyntaxError);
    expect(() => extractRaceRows('Time: 7\nDistance:')).toThrow(SyntaxError);
  });
});

describe('parseUnsignedBigInt', () => {
  it('parses unsigned digit tokens including 20-digit values', () => {
    expect(parseUnsignedBigInt('0', 'time')).toBe(0n);
    expect(parseUnsignedBigInt('12345678901234567890', 'distance')).toBe(12345678901234567890n);
  });

  it('rejects negative, empty, or non-numeric tokens', () => {
    expect(() => parseUnsignedBigInt('', 'time')).toThrow(SyntaxError);
    expect(() => parseUnsignedBigInt('-5', 'time')).toThrow(SyntaxError);
    expect(() => parseUnsignedBigInt('12a', 'distance')).toThrow(SyntaxError);
  });
});

describe('parseRaceColumns', () => {
  it('parses official 3-race input with irregular spacing', () => {
    const raw = 'Time:      7  15   30\nDistance:  9  40  200\n';
    const sheet = parseRaceColumns(raw);
    expect(sheet.races.length).toBe(3);
    expect(sheet.races[0]!.time).toBe(7n);
    expect(sheet.races[0]!.recordDistance).toBe(9n);
    expect(sheet.races[2]!.time).toBe(30n);
    expect(sheet.races[2]!.recordDistance).toBe(200n);
    expect(sheet.errorMargin).toBe(288n);
  });

  it('parses a single-race input with 20-digit tokens', () => {
    const raw = 'Time: 12345678901234567890\nDistance: 98765432109876543210\n';
    const sheet = parseRaceColumns(raw);
    expect(sheet.races.length).toBe(1);
    expect(sheet.races[0]!.time).toBe(12345678901234567890n);
    expect(sheet.races[0]!.recordDistance).toBe(98765432109876543210n);
  });

  it('rejects mismatched column counts', () => {
    expect(() => parseRaceColumns('Time: 7 15\nDistance: 9')).toThrow(SyntaxError);
  });

  it('rejects non-numeric race tokens', () => {
    expect(() => parseRaceColumns('Time: 7 x\nDistance: 9 40')).toThrow(SyntaxError);
    expect(() => parseRaceColumns('Time: 7 15\nDistance: 9 -40')).toThrow(SyntaxError);
  });
});
