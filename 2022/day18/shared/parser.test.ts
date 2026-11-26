import { describe, expect, it } from 'vitest';
import { parseDroplet, parseVoxelCoords } from './parser';

describe('Day 18 parser', () => {
  it('parses trimmed LF/CRLF lines, skips blanks, and normalizes -0', () => {
    const coords = parseVoxelCoords('  -0,1,2 \r\n\r\n  -3,4,-5\n');
    expect(coords).toEqual([
      { x: 0, y: 1, z: 2 },
      { x: -3, y: 4, z: -5 },
    ]);
    expect(Object.is(coords[0]!.x, 0)).toBe(true);
    expect(Object.isFrozen(coords)).toBe(true);
  });

  it('rejects empty or blank-only input', () => {
    expect(() => parseVoxelCoords('')).toThrow(RangeError);
    expect(() => parseVoxelCoords('   \r\n  \n')).toThrow(RangeError);
  });

  it('rejects malformed lines with 1-based line numbers', () => {
    expect(() => parseVoxelCoords('1,2,3\nbad_line')).toThrowError(SyntaxError);
    expect(() => parseVoxelCoords('1,2,3\n\n1, 2, 3')).toThrowError(/line 3/);
    expect(() => parseVoxelCoords('1,2')).toThrowError(/line 1/);
  });

  it('rejects integers outside safe integer range', () => {
    expect(() => parseVoxelCoords('9007199254740992,0,0')).toThrow(RangeError);
  });

  it('builds a VoxelDroplet directly via parseDroplet', () => {
    const droplet = parseDroplet('1,1,1\n2,1,1\n');
    expect(droplet.cubeCount).toBe(2);
    expect(droplet.totalSurfaceArea).toBe(10);
  });
});
