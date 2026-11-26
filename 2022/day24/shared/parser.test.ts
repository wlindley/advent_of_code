import { describe, expect, it } from 'vitest';
import { BLIZZARD_DOWN, BLIZZARD_LEFT, BLIZZARD_RIGHT, BLIZZARD_UP } from './basin';
import { parseBasin } from './parser';

const OFFICIAL_EXAMPLE = [
  '#.######',
  '#>>.<^<#',
  '#.<..<<#',
  '#>v.><>#',
  '#<^v^^>#',
  '######.#',
].join('\n');

describe('parseBasin', () => {
  it('parses the official 6x8 example basin accurately', () => {
    const basin = parseBasin(`${OFFICIAL_EXAMPLE}\r\n`);
    expect(basin.height).toBe(6);
    expect(basin.width).toBe(8);
    expect(basin.startCol).toBe(1);
    expect(basin.endCol).toBe(6);
    expect(basin.blizzardCount).toBe(19);
    expect(basin.blizzardMaskAt(0, 0, 0)).toBe(BLIZZARD_RIGHT);
    expect(basin.blizzardMaskAt(2, 1, 0)).toBe(BLIZZARD_DOWN);
    expect(basin.blizzardMaskAt(0, 4, 0)).toBe(BLIZZARD_UP);
    expect(basin.blizzardMaskAt(0, 5, 0)).toBe(BLIZZARD_LEFT);
  });

  it('rejects empty, undersized, jagged, or blank-line inputs', () => {
    expect(() => parseBasin('')).toThrow();
    expect(() => parseBasin('   \n  ')).toThrow();
    expect(() => parseBasin('#.#\n#.#')).toThrow(RangeError);
    expect(() => parseBasin('#.\n#.\n.#')).toThrow(RangeError);
    expect(() => parseBasin('#.#\n#...\n#.#')).toThrow();
    expect(() => parseBasin('#.###\n#...#\n\n#...#\n###.#')).toThrow();
    expect(() => parseBasin('#.#\n#.#\n#.##')).toThrow(); // jagged bottom line
  });

  it('rejects invalid wall openings, corners, side walls, and interior characters', () => {
    expect(() => parseBasin('..#\n#.#\n#.#')).toThrow(); // invalid top-left corner
    expect(() => parseBasin('#.#\n#.#\n#..')).toThrow(); // invalid bottom-right corner
    expect(() => parseBasin('###\n#.#\n#.#')).toThrow(); // no top opening
    expect(() => parseBasin('#..#\n#..#\n##.#')).toThrow(); // two top openings
    expect(() => parseBasin('#^#\n#.#\n#.#')).toThrow(); // invalid char in top wall
    expect(() => parseBasin('#.#\n..#\n#.#')).toThrow(); // missing left side wall
    expect(() => parseBasin('#.#\n#..\n#.#')).toThrow(); // missing right side wall
    expect(() => parseBasin('#.#\n#X#\n#.#')).toThrow(); // invalid interior char
    expect(() => parseBasin('#.#\n#.#\n###')).toThrow(); // no bottom opening
  });
});
