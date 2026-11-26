import { describe, expect, it } from 'vitest';
import { MirrorPattern, parseMirrorPatterns } from './pattern';

describe('MirrorPattern', () => {
  it('stores frozen defensive rows and computes width, height, and cell access', () => {
    const source = ['#.##..', '..##.#'];
    const pattern = new MirrorPattern(source);
    source[0] = '......';

    expect(Object.isFrozen(pattern)).toBe(true);
    expect(Object.isFrozen(pattern.rows)).toBe(true);
    expect(pattern.height).toBe(2);
    expect(pattern.width).toBe(6);
    expect(pattern.cell(0, 0)).toBe('#');
    expect(pattern.cell(0, 1)).toBe('.');
    expect(pattern.cell(1, 5)).toBe('#');
  });

  it('rejects empty, malformed, or jagged row inputs', () => {
    expect(() => new MirrorPattern([])).toThrow(RangeError);
    expect(() => new MirrorPattern([''])).toThrow(RangeError);
    expect(() => new MirrorPattern(['.#?'])).toThrow(RangeError);
    expect(() => new MirrorPattern(['..#', '.#'])).toThrow(RangeError);
  });

  it('validates row and column bounds in cell()', () => {
    const pattern = new MirrorPattern(['.#', '#.']);

    expect(() => pattern.cell(-1, 0)).toThrow(RangeError);
    expect(() => pattern.cell(2, 0)).toThrow(RangeError);
    expect(() => pattern.cell(0.5, 0)).toThrow(RangeError);
    expect(() => pattern.cell(0, -1)).toThrow(RangeError);
    expect(() => pattern.cell(0, 2)).toThrow(RangeError);
    expect(() => pattern.cell(0, Number.NaN)).toThrow(RangeError);
  });

  it('encodes row and column BigInt bitmasks accurately, including > 64 columns', () => {
    const wideRow = `${'.'.repeat(65)}#.`;
    const pattern = new MirrorPattern([wideRow, `#${'.'.repeat(66)}`]);

    const rowMasks = pattern.encodeRowMasks();
    const colMasks = pattern.encodeColMasks();

    expect(Object.isFrozen(rowMasks)).toBe(true);
    expect(Object.isFrozen(colMasks)).toBe(true);
    expect(rowMasks).toEqual([1n << 65n, 1n]);
    expect(colMasks.length).toBe(67);
    expect(colMasks[0]).toBe(2n);
    expect(colMasks[65]).toBe(1n);
    expect(colMasks[66]).toBe(0n);
  });
});

describe('parseMirrorPatterns', () => {
  it('parses blocks separated by blank lines and normalizes CRLF / whitespace', () => {
    const raw = '\r\n  #.## \r\n  ..## \r\n\t \r\n.#.\r\n###\r\n';
    const patterns = parseMirrorPatterns(raw);

    expect(Object.isFrozen(patterns)).toBe(true);
    expect(patterns).toHaveLength(2);
    expect(patterns[0]!.rows).toEqual(['#.##', '..##']);
    expect(patterns[1]!.rows).toEqual(['.#.', '###']);
  });

  it('rejects empty input and invalid blocks', () => {
    expect(() => parseMirrorPatterns('')).toThrow(RangeError);
    expect(() => parseMirrorPatterns('   \r\n\t\n  ')).toThrow(RangeError);
    expect(() => parseMirrorPatterns('#.\n#..')).toThrow(RangeError);
  });
});
