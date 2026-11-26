import { describe, expect, it } from 'vitest';
import { MainLoop, traceMainLoop } from './loop';
import { parsePipeMaze } from './maze';
import { createCoord } from './pipes';

describe('MainLoop and traceMainLoop', () => {
  it('traces the minimal 2x2 loop and computes derived properties without stored derived state', () => {
    const maze = parsePipeMaze('S7\nLJ');
    const loop = traceMainLoop(maze);

    expect(Object.isFrozen(loop)).toBe(true);
    expect(Object.isFrozen(loop.tiles)).toBe(true);
    expect(loop.rows).toBe(2);
    expect(loop.cols).toBe(2);
    expect(loop.length).toBe(4);
    expect(loop.farthestDistance).toBe(2);
    expect(loop.farthestCoord).toEqual({ row: 1, col: 1 });
    expect(loop.cycleIndexAt(0, 0)).toBe(0);
    expect(loop.distanceAt(0, 0)).toBe(0);
    expect(loop.distanceAt(0, 1)).toBe(1);
    expect(loop.distanceAt(1, 1)).toBe(2);
    expect(loop.distanceAt(1, 0)).toBe(1);
  });

  it('ignores disconnected clutter and marks off-loop cells with -1 / false', () => {
    const maze = parsePipeMaze(['F-7.', '|S7.', '|LJ.', 'L-J.'].join('\n'));
    const loop = traceMainLoop(maze);

    expect(loop.length).toBe(4);
    expect(loop.isOnLoop(1, 1)).toBe(true);
    expect(loop.isOnLoop(0, 0)).toBe(false);
    expect(loop.cycleIndexAt(0, 0)).toBe(-1);
    expect(loop.distanceAt(0, 0)).toBe(-1);
    expect(loop.distanceAt(3, 3)).toBe(-1);
  });

  it('throws when a loop breaks after S', () => {
    // S at (0,0) connects E to '-' and S to '|', but (0,2) '7' hits '.' at (1,2)
    const maze = parsePipeMaze(['S-7', '|..', 'L-J'].join('\n'));
    expect(() => traceMainLoop(maze)).toThrow('Main loop broke');
  });

  it('validates MainLoop dimensions, length parity, coordinate bounds, and uniqueness', () => {
    const validTiles = [createCoord(0, 0), createCoord(0, 1), createCoord(1, 1), createCoord(1, 0)];

    expect(() => new MainLoop(0, 2, validTiles)).toThrow(RangeError);
    expect(() => new MainLoop(1.5, 2, validTiles)).toThrow(RangeError);
    expect(() => new MainLoop(2, 0, validTiles)).toThrow(RangeError);
    expect(() => new MainLoop(2, 2.5, validTiles)).toThrow(RangeError);

    expect(() => new MainLoop(2, 2, [createCoord(0, 0), createCoord(0, 1)])).toThrow('length');
    expect(
      () =>
        new MainLoop(3, 3, [
          createCoord(0, 0),
          createCoord(0, 1),
          createCoord(0, 2),
          createCoord(1, 2),
          createCoord(1, 1),
        ]),
    ).toThrow('length');

    expect(
      () => new MainLoop(2, 2, [createCoord(-1, 0), createCoord(0, 1), createCoord(1, 1), createCoord(1, 0)]),
    ).toThrow(RangeError);
    expect(
      () => new MainLoop(2, 2, [createCoord(2, 0), createCoord(0, 1), createCoord(1, 1), createCoord(1, 0)]),
    ).toThrow(RangeError);
    expect(
      () => new MainLoop(2, 2, [createCoord(0, -1), createCoord(0, 1), createCoord(1, 1), createCoord(1, 0)]),
    ).toThrow(RangeError);
    expect(
      () => new MainLoop(2, 2, [createCoord(0, 2), createCoord(0, 1), createCoord(1, 1), createCoord(1, 0)]),
    ).toThrow(RangeError);
    expect(
      () => new MainLoop(2, 2, [createCoord(0.5, 0), createCoord(0, 1), createCoord(1, 1), createCoord(1, 0)]),
    ).toThrow(RangeError);
    expect(
      () => new MainLoop(2, 2, [createCoord(0, 0.5), createCoord(0, 1), createCoord(1, 1), createCoord(1, 0)]),
    ).toThrow(RangeError);

    expect(
      () => new MainLoop(2, 2, [createCoord(0, 0), createCoord(0, 1), createCoord(0, 0), createCoord(1, 0)]),
    ).toThrow('Duplicate loop coordinate');

    const loop = new MainLoop(2, 2, validTiles);
    expect(() => loop.cycleIndexAt(-1, 0)).toThrow(RangeError);
    expect(() => loop.isOnLoop(0, 2)).toThrow(RangeError);
    expect(() => loop.distanceAt(0.5, 0)).toThrow(RangeError);
  });
});
