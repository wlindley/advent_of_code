import { describe, expect, it } from 'vitest';
import { parsePipeMaze } from './maze';
import { DIR_E, DIR_N, DIR_S, DIR_W, createCoord, tileMask } from './pipes';

describe('PipeMaze parsing and navigation', () => {
  it('parses CRLF input with trailing blank lines and exposes grid metadata', () => {
    const maze = parsePipeMaze('S7\r\nLJ\r\n\r\n');
    expect(maze.rows).toBe(2);
    expect(maze.cols).toBe(2);
    expect(maze.size).toBe(4);
    expect(maze.start).toEqual({ row: 0, col: 0 });
    expect(maze.inferredStartTile).toBe('F');
    expect(maze.rawAt(0, 0)).toBe('S');
    expect(maze.effectiveTileAt(0, 0)).toBe('F');
    expect(maze.effectiveTileAt(1, 1)).toBe('J');
    expect(maze.effectiveMaskAt(0, 0)).toBe(tileMask('F'));
    expect(maze.inBounds(0, 0)).toBe(true);
    expect(maze.inBounds(-1, 0)).toBe(false);
    expect(Object.isFrozen(maze)).toBe(true);
  });

  it('rejects empty, jagged, or invalid-character inputs', () => {
    expect(() => parsePipeMaze('')).toThrow();
    expect(() => parsePipeMaze('\n..')).toThrow();
    expect(() => parsePipeMaze('S-\n|')).toThrow();
    expect(() => parsePipeMaze('S?\nLJ')).toThrow('Invalid pipe symbol "?" at (0, 1)');
  });

  it('rejects missing or duplicate start tiles', () => {
    expect(() => parsePipeMaze('F7\nLJ')).toThrow('Missing start tile "S"');
    expect(() => parsePipeMaze('S7\nLS')).toThrow('Multiple start tiles "S"');
  });

  it('infers all six pipe shapes for S and handles all four borders and corners', () => {
    const cases = [
      { grid: '.\n|\nS\n|\n.', expected: '|', start: [2, 0] },
      { grid: '-S-', expected: '-', start: [0, 1] },
      { grid: '|.\nS-', expected: 'L', start: [1, 0] },
      { grid: '.|\n-S', expected: 'J', start: [1, 1] },
      { grid: '-S\n.|', expected: '7', start: [0, 1] },
      { grid: 'S-\n|.', expected: 'F', start: [0, 0] },
    ] as const;

    for (const c of cases) {
      const maze = parsePipeMaze(c.grid);
      expect(maze.start).toEqual({ row: c.start[0], col: c.start[1] });
      expect(maze.inferredStartTile).toBe(c.expected);
    }
  });

  it('rejects S with degree 0, 1, 3, or 4', () => {
    expect(() => parsePipeMaze('...\n.S.\n...')).toThrow('degree');
    expect(() => parsePipeMaze('...\n.S-\n...')).toThrow('degree');
    expect(() => parsePipeMaze('.|.\n-S-\n...')).toThrow('degree');
    expect(() => parsePipeMaze('.|.\n-S-\n.|.')).toThrow('degree');
  });

  it('steps only through reciprocal ports within bounds and throws on invalid origin', () => {
    const maze = parsePipeMaze(['F-7', '|.|', 'S-J'].join('\n'));
    // S at (2, 0) connects N and E (inferred 'L')
    expect(maze.stepFrom(createCoord(2, 0), DIR_N)).toEqual({ row: 1, col: 0 });
    expect(maze.stepFrom(createCoord(2, 0), DIR_E)).toEqual({ row: 2, col: 1 });
    // No outgoing port in S or W from 'L'
    expect(maze.stepFrom(createCoord(2, 0), DIR_S)).toBeNull();
    expect(maze.stepFrom(createCoord(2, 0), DIR_W)).toBeNull();
    // Outgoing port points out of grid bounds (top border '|' at (0,0))
    const borderMaze = parsePipeMaze(['|S7', '|||', 'L-J'].join('\n'));
    expect(borderMaze.stepFrom(createCoord(0, 0), DIR_N)).toBeNull();
    // Outgoing port points to neighbor lacking reciprocal port
    const mismatchMaze = parsePipeMaze(['S-.', 'L-J'].join('\n'));
    // (0,1) is '-' pointing E to '.' at (0,2)
    expect(mismatchMaze.stepFrom(createCoord(0, 1), DIR_E)).toBeNull();
    // Out-of-bounds origin throws RangeError
    expect(() => maze.stepFrom(createCoord(-1, 0), DIR_N)).toThrow(RangeError);
    expect(() => maze.stepFrom(createCoord(0, 3), DIR_W)).toThrow(RangeError);
  });
});
