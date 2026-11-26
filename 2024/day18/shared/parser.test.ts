import { describe, expect, it } from 'vitest';
import { parseByteCoords, parseMemorySpace } from './parser';

describe('parseByteCoords', () => {
  it('parses LF and CRLF coordinate lists with trailing newlines', () => {
    const coords = parseByteCoords('5,4\r\n4,2\r\n0,6\r\n\r\n');
    expect(coords).toEqual([
      { x: 5, y: 4 },
      { x: 4, y: 2 },
      { x: 0, y: 6 },
    ]);
    expect(Object.isFrozen(coords)).toBe(true);
    expect(Object.isFrozen(coords[0])).toBe(true);
  });

  it('rejects empty, malformed, and unsafe integer inputs', () => {
    expect(() => parseByteCoords('')).toThrow(Error);
    expect(() => parseByteCoords('\r\n\n')).toThrow(Error);
    expect(() => parseByteCoords('1,2\n\n3,4')).toThrow(Error);
    expect(() => parseByteCoords('1,-2')).toThrow(Error);
    expect(() => parseByteCoords('1,2,3')).toThrow(Error);
    expect(() => parseByteCoords('9007199254740992,1')).toThrow(RangeError);
    expect(() => parseByteCoords('1,9007199254740992')).toThrow(RangeError);
  });
});

describe('parseMemorySpace', () => {
  it('parses coordinates into a bounded MemorySpace', () => {
    const space = parseMemorySpace('1,2\n3,0\n', 4);
    expect(space.gridSize).toBe(4);
    expect(space.byteCount).toBe(2);
    expect(space.firstFallAt(1, 2)).toBe(0);
    expect(space.firstFallAt(3, 0)).toBe(1);
    expect(() => parseMemorySpace('4,0', 4)).toThrow(RangeError);
  });
});
