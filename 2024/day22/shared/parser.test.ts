import { describe, expect, it } from 'vitest';
import { parseBuyerSeeds } from './parser';

describe('parseBuyerSeeds', () => {
  it('parses newline-separated non-negative safe integers and freezes output', () => {
    const seeds = parseBuyerSeeds('1\n 10 \n\r\n100\n2024\n0\n');
    expect(seeds).toEqual([1, 10, 100, 2024, 0]);
    expect(Object.isFrozen(seeds)).toBe(true);
    expect(parseBuyerSeeds(`${Number.MAX_SAFE_INTEGER}`)).toEqual([Number.MAX_SAFE_INTEGER]);
  });

  it('rejects empty or whitespace-only inputs', () => {
    expect(() => parseBuyerSeeds('')).toThrow(RangeError);
    expect(() => parseBuyerSeeds('  \n\t\r\n ')).toThrow(RangeError);
  });

  it('rejects negative, fractional, non-numeric, and unsafe integer lines', () => {
    expect(() => parseBuyerSeeds('-1')).toThrow(RangeError);
    expect(() => parseBuyerSeeds('12.5')).toThrow(RangeError);
    expect(() => parseBuyerSeeds('12abc')).toThrow(RangeError);
    expect(() => parseBuyerSeeds('9007199254740992')).toThrow(RangeError);
  });
});
