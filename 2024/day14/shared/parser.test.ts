import { describe, expect, it } from 'vitest';
import { Robot } from './model';
import { parseRobots } from './parser';

describe('parseRobots', () => {
  it('parses valid lines with CRLF, surrounding whitespace, and blank lines', () => {
    const raw = '  p=0,4 v=3,-3  \r\n\r\n p=10,3   v=-1,2\r\n';
    const robots = parseRobots(raw);
    expect(Object.isFrozen(robots)).toBe(true);
    expect(robots).toHaveLength(2);
    expect(robots[0]).toBeInstanceOf(Robot);
    expect(robots[0]).toEqual({ x: 0, y: 4, vx: 3, vy: -3 });
    expect(robots[1]).toEqual({ x: 10, y: 3, vx: -1, vy: 2 });
  });

  it('rejects empty or whitespace-only input', () => {
    expect(() => parseRobots('')).toThrow(Error);
    expect(() => parseRobots('   \r\n  \n')).toThrow(Error);
  });

  it('rejects malformed lines and unsafe integer values', () => {
    expect(() => parseRobots('p=-1,4 v=3,-3')).toThrow(Error);
    expect(() => parseRobots('p=0,4 v=3')).toThrow(Error);
    expect(() => parseRobots('p=9007199254740992,0 v=0,0')).toThrow(RangeError);
  });
});
