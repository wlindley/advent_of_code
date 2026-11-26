import { describe, expect, it } from 'vitest';
import { parseMergedRace } from './index';

describe('parseMergedRace', () => {
  it('merges kerning spaces in the official example to (71530n, 940200n)', () => {
    const sheet = parseMergedRace('Time:      7  15   30\nDistance:  9  40  200\n');
    expect(sheet.races.length).toBe(1);
    expect(sheet.races[0]!.time).toBe(71530n);
    expect(sheet.races[0]!.recordDistance).toBe(940200n);
  });

  it('handles CRLF, tabs, and blank lines', () => {
    const sheet = parseMergedRace('\r\nTime:\t7\t 15   30\r\n\r\nDistance:\t9  40\t200\r\n\r\n');
    expect(sheet.races[0]!.time).toBe(71530n);
    expect(sheet.races[0]!.recordDistance).toBe(940200n);
  });

  it('parses already-merged input', () => {
    const sheet = parseMergedRace('Time: 71530\nDistance: 940200');
    expect(sheet.races[0]!.time).toBe(71530n);
    expect(sheet.races[0]!.recordDistance).toBe(940200n);
  });

  it('merges uneven token counts across rows', () => {
    const sheet = parseMergedRace('Time: 7 15 30\nDistance: 94 0200');
    expect(sheet.races[0]!.time).toBe(71530n);
    expect(sheet.races[0]!.recordDistance).toBe(940200n);
  });

  it('preserves leading-zero concatenation as decimal BigInt', () => {
    const sheet = parseMergedRace('Time: 00 07 05\nDistance: 00 09');
    expect(sheet.races[0]!.time).toBe(705n);
    expect(sheet.races[0]!.recordDistance).toBe(9n);
  });

  it('parses 21-digit and 40-digit BigInts without precision loss', () => {
    const t21 = '123456789012345678901';
    const d40 = '9876543210987654321098765432109876543210';
    const sheet = parseMergedRace(
      `Time: ${t21.slice(0, 10)} ${t21.slice(10)}\nDistance: ${d40.slice(0, 20)} ${d40.slice(20)}`,
    );
    expect(sheet.races[0]!.time).toBe(BigInt(t21));
    expect(sheet.races[0]!.recordDistance).toBe(BigInt(d40));
  });

  it('rejects empty input', () => {
    expect(() => parseMergedRace('   \n\t  ')).toThrow(SyntaxError);
  });
  it('rejects 1-line input', () => {
    expect(() => parseMergedRace('Time: 7 15')).toThrow(SyntaxError);
  });
  it('rejects 3-line input', () => {
    expect(() => parseMergedRace('Time: 7\nDistance: 9\nExtra: 1')).toThrow(SyntaxError);
  });
  it('rejects wrong Time header', () => {
    expect(() => parseMergedRace('Duration: 7 15\nDistance: 9 40')).toThrow(SyntaxError);
  });
  it('rejects wrong Distance header', () => {
    expect(() => parseMergedRace('Time: 7 15\nLength: 9 40')).toThrow(SyntaxError);
  });
  it('rejects empty Time body', () => {
    expect(() => parseMergedRace('Time:   \nDistance: 9 40')).toThrow(SyntaxError);
  });
  it('rejects empty Distance body', () => {
    expect(() => parseMergedRace('Time: 7 15\nDistance:')).toThrow(SyntaxError);
  });
  it('rejects letters in values', () => {
    expect(() => parseMergedRace('Time: 7 a5\nDistance: 9 40')).toThrow(SyntaxError);
  });
  it('rejects decimal values', () => {
    expect(() => parseMergedRace('Time: 7 15\nDistance: 9.5 40')).toThrow(SyntaxError);
  });
  it('rejects negative Time', () => {
    expect(() => parseMergedRace('Time: -7 15\nDistance: 9 40')).toThrow(SyntaxError);
  });
  it('rejects negative Distance', () => {
    expect(() => parseMergedRace('Time: 7 15\nDistance: 9 -40')).toThrow(SyntaxError);
  });
});
