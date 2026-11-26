import { describe, expect, it } from 'vitest';
import { parseCrabFleet } from './parser';

describe('parseCrabFleet', () => {
  it('parses comma-separated integers with surrounding whitespace and trailing newline', () => {
    const fleet = parseCrabFleet(' 16, 1,2, 0 , -4 , 1000000000000000000000 \n');
    expect(fleet.positions).toEqual([16n, 1n, 2n, 0n, -4n, 1000000000000000000000n]);
  });

  it('rejects empty or whitespace-only input with RangeError', () => {
    expect(() => parseCrabFleet('')).toThrow(RangeError);
    expect(() => parseCrabFleet('   \n\t  ')).toThrow(RangeError);
  });

  it('rejects multi-line input with SyntaxError', () => {
    expect(() => parseCrabFleet('1,2\n3,4')).toThrow(SyntaxError);
    expect(() => parseCrabFleet('1,2\r\n3,4')).toThrow(SyntaxError);
  });

  it('rejects empty tokens, trailing commas, decimals, and non-numeric tokens with SyntaxError', () => {
    expect(() => parseCrabFleet('1,2,')).toThrow(SyntaxError);
    expect(() => parseCrabFleet('1,,2')).toThrow(SyntaxError);
    expect(() => parseCrabFleet('1,2.5,3')).toThrow(SyntaxError);
    expect(() => parseCrabFleet('1,abc,3')).toThrow(SyntaxError);
    expect(() => parseCrabFleet('+1,2')).toThrow(SyntaxError);
  });
});
