import { describe, expect, it } from 'vitest';
import { parseTrenchMap } from './parser';

const WRAPPED_EXAMPLE = [
  '..#.#..#####.#.#.#.###.##.....###.##.#..###.####..#####..#....#..#..##..##',
  '#..######.###...####..#..#####..##..#.#####...##.#.#..#.##..#.#......#.###',
  '.######.###.####...#.##.##..#..#..#####.....#.#....###..#.##......#.....#.',
  '.#..#..##..#...##.######.####.####.#.#...#.......#..#.#.#...####.##.#.....',
  '.#..#...##.#.##..#...##.#.##..###.#......#.#.......#.#.#.####.###.##...#..',
  '...####.#..#..#.##.#....##..#.####....##...##..#...#......#.#.......#.....',
  '..##..####..#...#.#.#...##..#.#..###..#####........#..####......#..#',
  '',
  '#..#.',
  '#....',
  '##..#',
  '..#..',
  '..###',
].join('\n');

const VALID_ALGO = '.'.repeat(512);

describe('parseTrenchMap', () => {
  it('parses wrapped algorithm lines, CRLF line endings, and outer whitespace', () => {
    const crlf = `\n  ${WRAPPED_EXAMPLE.replace(/\n/g, '\r\n')}  \r\n`;
    const parsed = parseTrenchMap(crlf);

    expect(parsed.algorithm.lookup(0)).toBe(0);
    expect(parsed.algorithm.lookup(34)).toBe(1);
    expect(parsed.algorithm.lookup(511)).toBe(1);
    expect(parsed.image.height).toBe(5);
    expect(parsed.image.width).toBe(5);
    expect(parsed.image.background).toBe(0);
    expect(parsed.image.finiteLitCount).toBe(10);
  });

  it('rejects empty input or wrong number of blank-line-separated sections', () => {
    expect(() => parseTrenchMap('   \n  ')).toThrow();
    expect(() => parseTrenchMap(VALID_ALGO)).toThrow();
    expect(() => parseTrenchMap(`${VALID_ALGO}\n\n#.\n\n.#`)).toThrow();
  });

  it('rejects invalid algorithm length or invalid algorithm characters', () => {
    expect(() => parseTrenchMap(`${'.'.repeat(511)}\n\n#`)).toThrow(RangeError);
    expect(() => parseTrenchMap(`${'.'.repeat(511)}X\n\n#`)).toThrow();
  });

  it('rejects empty image rows, ragged image grids, and invalid image characters', () => {
    expect(() => parseTrenchMap(`${VALID_ALGO}\n\n   \n#`)).toThrow();
    expect(() => parseTrenchMap(`${VALID_ALGO}\n\n#.\n#`)).toThrow();
    expect(() => parseTrenchMap(`${VALID_ALGO}\n\n#?\n..`)).toThrow();
  });
});
