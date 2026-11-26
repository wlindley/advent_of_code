import { describe, expect, it } from 'vitest';
import {
  blinkStone,
  parsePebbleLine,
  PebbleLine,
  STONE_SCALE_FACTOR,
} from './index';

describe('blinkStone', () => {
  it('exposes the 2024n scale factor', () => {
    expect(STONE_SCALE_FACTOR).toBe(2024n);
  });

  it('maps 0n to frozen zero transition [1n]', () => {
    const t = blinkStone(0n);
    expect(t).toEqual({ rule: 'zero', outputs: [1n] });
    expect(Object.isFrozen(t)).toBe(true);
    expect(Object.isFrozen(t.outputs)).toBe(true);
  });

  it('splits even-digit stones and strips leading zeros on the right half', () => {
    expect(blinkStone(10n)).toEqual({ rule: 'split', outputs: [1n, 0n] });
    expect(blinkStone(99n)).toEqual({ rule: 'split', outputs: [9n, 9n] });
    expect(blinkStone(1000n)).toEqual({ rule: 'split', outputs: [10n, 0n] });
    expect(blinkStone(253000n)).toEqual({ rule: 'split', outputs: [253n, 0n] });
  });

  it('scales odd-digit stones by 2024n', () => {
    expect(blinkStone(1n)).toEqual({ rule: 'scale', outputs: [2024n] });
    expect(blinkStone(125n)).toEqual({ rule: 'scale', outputs: [253000n] });
    expect(blinkStone(999n)).toEqual({ rule: 'scale', outputs: [2021976n] });
  });

  it('handles BigInt stones above Number.MAX_SAFE_INTEGER without precision loss', () => {
    const bigOdd = 10_000_000_000_000_007n; // 17 digits
    expect(blinkStone(bigOdd)).toEqual({
      rule: 'scale',
      outputs: [bigOdd * 2024n],
    });

    const bigEven = 123456789012345678n; // 18 digits
    expect(blinkStone(bigEven)).toEqual({
      rule: 'split',
      outputs: [123456789n, 12345678n],
    });
  });

  it('rejects negative stone values', () => {
    expect(() => blinkStone(-1n)).toThrow(RangeError);
  });
});

describe('PebbleLine', () => {
  it('stores a frozen defensive copy and exposes length', () => {
    const source = [125n, 17n];
    const line = new PebbleLine(source);
    source.push(99n);

    expect(line.length).toBe(2);
    expect(line.stones).toEqual([125n, 17n]);
    expect(Object.isFrozen(line)).toBe(true);
    expect(Object.isFrozen(line.stones)).toBe(true);
  });

  it('builds a BigInt histogram for unique and duplicate stones', () => {
    const unique = new PebbleLine([0n, 1n, 10n]).toHistogram();
    expect(unique.get(0n)).toBe(1n);
    expect(unique.get(1n)).toBe(1n);
    expect(unique.get(10n)).toBe(1n);
    expect(unique.size).toBe(3);

    const dupes = new PebbleLine([7n, 0n, 7n, 7n, 0n]).toHistogram();
    expect(dupes.get(7n)).toBe(3n);
    expect(dupes.get(0n)).toBe(2n);
    expect(dupes.size).toBe(2);
  });

  it('rejects empty lines and negative stones', () => {
    expect(() => new PebbleLine([])).toThrow(RangeError);
    expect(() => new PebbleLine([1n, -5n])).toThrow(RangeError);
  });
});

describe('parsePebbleLine', () => {
  it('parses space, tab, and newline separated non-negative integer stones', () => {
    const line = parsePebbleLine('  0  125\t17\n007  9007199254740993  ');
    expect(line.stones).toEqual([0n, 125n, 17n, 7n, 9007199254740993n]);
  });

  it('rejects empty or whitespace-only input', () => {
    expect(() => parsePebbleLine('')).toThrow(RangeError);
    expect(() => parsePebbleLine('   \n\t  ')).toThrow(RangeError);
  });

  it('rejects negative tokens', () => {
    expect(() => parsePebbleLine('12 -3 4')).toThrow(SyntaxError);
  });

  it('rejects decimal tokens', () => {
    expect(() => parsePebbleLine('12 3.14')).toThrow(SyntaxError);
  });

  it('rejects alphabetic tokens', () => {
    expect(() => parsePebbleLine('12 abc')).toThrow(SyntaxError);
  });

  it('rejects plus-signed tokens', () => {
    expect(() => parsePebbleLine('+12')).toThrow(SyntaxError);
  });
});
