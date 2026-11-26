import { describe, expect, it } from 'vitest';
import { parsePipeMaze, traceMainLoop } from '../../shared';
import { EnclosedAnalysis, analyzeEnclosedTiles } from './index';

const EXAMPLE_PART1_SIMPLE = ['.....', '.S-7.', '.|.|.', '.L-J.', '.....'].join('\n');
const EXAMPLE_PART1_CLUTTERED = ['7-F7-', '.FJ|7', 'SJLL7', '|F--J', 'LJ.LJ'].join('\n');

const EXAMPLE_PART2_1 = [
  '...........',
  '.S-------7.',
  '.|F-----7|.',
  '.||.....||.',
  '.||.....||.',
  '.|L-7.F-J|.',
  '.|..|.|..|.',
  '.L--J.L--J.',
  '...........',
].join('\n');

const EXAMPLE_PART2_2 = [
  '..........',
  '.S------7.',
  '.|F----7|.',
  '.||....||.',
  '.||....||.',
  '.|L-7F-J|.',
  '.|..||..|.',
  '.L--JL--J.',
  '..........',
].join('\n');

const EXAMPLE_PART2_3 = [
  '.F----7F7F7F7F-7....',
  '.|F--7||||||||FJ....',
  '.||.FJ||||||||L7....',
  'FJL7L7LJLJ||LJ.L-7..',
  'L--J.L7...LJS7F-7L7.',
  '....F-J..F7FJ|L7L7L7',
  '....L7.F7||L7|.L7L7|',
  '.....|FJLJ|FJ|F7|.LJ',
  '....FJL-7.||.||||...',
  '....L---J.LJ.LJLJ...',
].join('\n');

const EXAMPLE_PART2_4 = [
  'FF7FSF7F7F7F7F7F---7',
  'L|LJ||||||||||||F--J',
  'FL-7LJLJ||||||LJL-77',
  'F--JF--7||LJLJ7F7FJ-',
  'L---JF-JLJ.||-FJLJJ7',
  '|F|F-JF---7F7-L7L|7|',
  '|FFJF7L7F-JF7|JL---7',
  '7-L-JL7||F7|L7F-7F7|',
  'L.L7LFJ|||||FJL7||LJ',
  'L7JLJL-JLJLJL--JLJ.L',
].join('\n');

function analyzeRaw(raw: string): EnclosedAnalysis {
  const maze = parsePipeMaze(raw);
  return analyzeEnclosedTiles(maze, traceMainLoop(maze));
}

describe('analyzeEnclosedTiles', () => {
  it('computes enclosed counts for all official Part 2 and Part 1 examples', () => {
    expect(analyzeRaw(EXAMPLE_PART2_1).count).toBe(4);
    expect(analyzeRaw(EXAMPLE_PART2_2).count).toBe(4);
    expect(analyzeRaw(EXAMPLE_PART2_3).count).toBe(8);
    expect(analyzeRaw(EXAMPLE_PART2_4).count).toBe(10);
    expect(analyzeRaw(EXAMPLE_PART1_SIMPLE).count).toBe(1);
    expect(analyzeRaw(EXAMPLE_PART1_CLUTTERED).count).toBe(1);
  });

  it('returns 0 enclosed tiles for a minimal 2x2 loop', () => {
    const analysis = analyzeRaw(['S7', 'LJ'].join('\n'));
    expect(analysis.count).toBe(0);
    expect(analysis.northCrossingsAtRow(0)).toBe(0);
    expect(analysis.northCrossingsAtRow(1)).toBe(2);
    expect(analysis.enclosedInRow(0)).toBe(0);
    expect(analysis.isEnclosed(0, 0)).toBe(false);
  });

  it('handles all six inferred start shapes identically on a 3x3 enclosing loop', () => {
    const cases: readonly { raw: string; expectedS: string }[] = [
      { raw: ['F-7', 'S.|', 'L-J'].join('\n'), expectedS: '|' },
      { raw: ['FS7', '|.|', 'L-J'].join('\n'), expectedS: '-' },
      { raw: ['F-7', '|.|', 'S-J'].join('\n'), expectedS: 'L' },
      { raw: ['F-7', '|.|', 'L-S'].join('\n'), expectedS: 'J' },
      { raw: ['F-S', '|.|', 'L-J'].join('\n'), expectedS: '7' },
      { raw: ['S-7', '|.|', 'L-J'].join('\n'), expectedS: 'F' },
    ];
    for (const { raw, expectedS } of cases) {
      const maze = parsePipeMaze(raw);
      expect(maze.inferredStartTile).toBe(expectedS);
      const analysis = analyzeEnclosedTiles(maze, traceMainLoop(maze));
      expect(analysis.count).toBe(1);
      expect(analysis.isEnclosed(1, 1)).toBe(true);
    }
  });

  it('tracks per-row north crossings and enclosed counts with defensive copying', () => {
    const analysis = analyzeRaw(EXAMPLE_PART1_SIMPLE);
    expect(analysis.northCrossingsAtRow(1)).toBe(0);
    expect(analysis.northCrossingsAtRow(2)).toBe(2);
    expect(analysis.northCrossingsAtRow(3)).toBe(2);
    expect(analysis.enclosedInRow(2)).toBe(1);
    expect(analysis.isEnclosed(2, 2)).toBe(true);
    expect(analysis.isEnclosed(2, 1)).toBe(false);

    const copy = analysis.copyMask();
    copy[0] = 1;
    expect(analysis.isEnclosed(0, 0)).toBe(false);
    expect(Object.isFrozen(analysis)).toBe(true);
  });

  it('throws when maze and loop dimensions do not match', () => {
    const smallMaze = parsePipeMaze(['S7', 'LJ'].join('\n'));
    const tallMaze = parsePipeMaze(['S7', 'LJ', '..'].join('\n'));
    const wideMaze = parsePipeMaze(['S7.', 'LJ.'].join('\n'));
    expect(() => analyzeEnclosedTiles(smallMaze, traceMainLoop(tallMaze))).toThrow(RangeError);
    expect(() => analyzeEnclosedTiles(smallMaze, traceMainLoop(wideMaze))).toThrow(RangeError);
  });
});

describe('EnclosedAnalysis validation', () => {
  it('defensively copies constructor inputs and rejects invalid dimensions', () => {
    const mask = new Uint8Array([0, 1, 0, 0]);
    const crossings = [0, 2];
    const analysis = new EnclosedAnalysis(2, 2, mask, crossings);
    mask[0] = 1;
    crossings[0] = 99;
    expect(analysis.isEnclosed(0, 0)).toBe(false);
    expect(analysis.northCrossingsAtRow(0)).toBe(0);

    expect(() => new EnclosedAnalysis(0, 2, mask, crossings)).toThrow(RangeError);
    expect(() => new EnclosedAnalysis(2, -1, mask, crossings)).toThrow(RangeError);
    expect(() => new EnclosedAnalysis(1.5, 2, mask, crossings)).toThrow(RangeError);
  });

  it('rejects malformed masks or invalid crossings tables', () => {
    expect(() => new EnclosedAnalysis(2, 2, new Uint8Array(3), [0, 2])).toThrow(RangeError);
    expect(() => new EnclosedAnalysis(2, 2, new Uint8Array([0, 2, 0, 0]), [0, 2])).toThrow(RangeError);
    expect(() => new EnclosedAnalysis(2, 2, new Uint8Array(4), [0])).toThrow(RangeError);
    expect(() => new EnclosedAnalysis(2, 2, new Uint8Array(4), [-2, 0])).toThrow(RangeError);
    expect(() => new EnclosedAnalysis(2, 2, new Uint8Array(4), [1, 0])).toThrow(RangeError);
    expect(() => new EnclosedAnalysis(2, 2, new Uint8Array(4), [1.5, 0])).toThrow(RangeError);
  });

  it('throws RangeError on out-of-bounds query coordinates or rows', () => {
    const analysis = new EnclosedAnalysis(2, 2, new Uint8Array(4), [0, 2]);
    expect(() => analysis.northCrossingsAtRow(-1)).toThrow(RangeError);
    expect(() => analysis.northCrossingsAtRow(2)).toThrow(RangeError);
    expect(() => analysis.northCrossingsAtRow(0.5)).toThrow(RangeError);
    expect(() => analysis.enclosedInRow(2)).toThrow(RangeError);
    expect(() => analysis.isEnclosed(0, -1)).toThrow(RangeError);
    expect(() => analysis.isEnclosed(0, 2)).toThrow(RangeError);
    expect(() => analysis.isEnclosed(0, 0.5)).toThrow(RangeError);
    expect(() => analysis.isEnclosed(-1, 0)).toThrow(RangeError);
  });
});
