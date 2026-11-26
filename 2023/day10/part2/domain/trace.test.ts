import { describe, expect, it } from 'vitest';
import { parsePipeMaze, traceMainLoop } from '../../shared';
import { analyzeEnclosedTiles, buildEnclosedScanTrace } from './index';

const SMALL_MAZE = ['.....', '.S-7.', '.|.|.', '.L-J.', '.....'].join('\n');

const TEN_ROW_MAZE = [
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

describe('buildEnclosedScanTrace', () => {
  it('emits every row frame with cumulative counts for small grids', () => {
    const maze = parsePipeMaze(SMALL_MAZE);
    const analysis = analyzeEnclosedTiles(maze, traceMainLoop(maze));
    const frames = buildEnclosedScanTrace(analysis);

    expect(frames).toHaveLength(5);
    expect(frames[0]).toEqual({
      row: 0,
      totalRows: 5,
      northCrossings: 0,
      enclosedInRow: 0,
      cumulativeEnclosed: 0,
    });
    expect(frames[2]).toEqual({
      row: 2,
      totalRows: 5,
      northCrossings: 2,
      enclosedInRow: 1,
      cumulativeEnclosed: 1,
    });
    expect(frames[4]?.cumulativeEnclosed).toBe(analysis.count);
  });

  it('bounds trace frames when maxSteps is smaller than total rows', () => {
    const maze = parsePipeMaze(TEN_ROW_MAZE);
    const analysis = analyzeEnclosedTiles(maze, traceMainLoop(maze));
    const frames = buildEnclosedScanTrace(analysis, { maxSteps: 4 });

    expect(frames).toHaveLength(4);
    expect(frames[0]?.row).toBe(0);
    expect(frames[3]?.row).toBe(9);
    expect(frames[3]?.cumulativeEnclosed).toBe(10);
  });

  it('returns only the final row when maxSteps is 1', () => {
    const maze = parsePipeMaze(SMALL_MAZE);
    const analysis = analyzeEnclosedTiles(maze, traceMainLoop(maze));
    const frames = buildEnclosedScanTrace(analysis, { maxSteps: 1 });

    expect(frames).toHaveLength(1);
    expect(frames[0]?.row).toBe(4);
    expect(frames[0]?.cumulativeEnclosed).toBe(1);
  });

  it('returns deeply frozen trace frames', () => {
    const maze = parsePipeMaze(SMALL_MAZE);
    const analysis = analyzeEnclosedTiles(maze, traceMainLoop(maze));
    const frames = buildEnclosedScanTrace(analysis);

    expect(Object.isFrozen(frames)).toBe(true);
    for (const frame of frames) {
      expect(Object.isFrozen(frame)).toBe(true);
    }
  });

  it('rejects invalid maxSteps values with RangeError', () => {
    const maze = parsePipeMaze(SMALL_MAZE);
    const analysis = analyzeEnclosedTiles(maze, traceMainLoop(maze));

    expect(() => buildEnclosedScanTrace(analysis, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildEnclosedScanTrace(analysis, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => buildEnclosedScanTrace(analysis, { maxSteps: 2.5 })).toThrow(RangeError);
    expect(() => buildEnclosedScanTrace(analysis, { maxSteps: Number.NaN })).toThrow(RangeError);
  });
});
