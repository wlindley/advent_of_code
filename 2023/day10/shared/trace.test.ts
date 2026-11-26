import { describe, expect, it } from 'vitest';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DIR_N,
  MainLoop,
  buildLoopWalkTrace,
  createCoord,
  parsePipeMaze,
  traceMainLoop,
} from './index';

describe('buildLoopWalkTrace', () => {
  it('produces exact wavefront frames for the minimal 2x2 loop', () => {
    const maze = parsePipeMaze('S7\nLJ');
    const loop = traceMainLoop(maze);
    const frames = buildLoopWalkTrace(loop);

    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toEqual([
      { distance: 0, frontA: { row: 0, col: 0 }, frontB: { row: 0, col: 0 }, discoveredTiles: 1 },
      { distance: 1, frontA: { row: 1, col: 0 }, frontB: { row: 0, col: 1 }, discoveredTiles: 3 },
      { distance: 2, frontA: { row: 1, col: 1 }, frontB: { row: 1, col: 1 }, discoveredTiles: 4 },
    ]);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(DIR_N).toBe(1);
  });

  it('supports maxSteps = 1 and maxSteps = 2 with endpoint preservation', () => {
    const maze = parsePipeMaze(['F-7', '|S7', '|LJ', 'L-J'].join('\n'));
    // Wait: let's build a 6-tile loop cleanly using MainLoop
    const tiles = [
      createCoord(0, 0),
      createCoord(0, 1),
      createCoord(0, 2),
      createCoord(1, 2),
      createCoord(1, 1),
      createCoord(1, 0),
    ];
    const loop = new MainLoop(2, 3, tiles);
    expect(maze.rows).toBe(4);

    const single = buildLoopWalkTrace(loop, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]).toEqual({
      distance: 3,
      frontA: { row: 1, col: 2 },
      frontB: { row: 1, col: 2 },
      discoveredTiles: 6,
    });

    const pair = buildLoopWalkTrace(loop, { maxSteps: 2 });
    expect(pair).toHaveLength(2);
    expect(pair[0]?.distance).toBe(0);
    expect(pair[1]?.distance).toBe(3);
  });

  it('samples large loops down to DEFAULT_MAX_TRACE_STEPS while preserving endpoints', () => {
    const rows = 2;
    const cols = 200;
    const tiles = [];
    for (let c = 0; c < cols; c += 1) tiles.push(createCoord(0, c));
    for (let c = cols - 1; c >= 0; c -= 1) tiles.push(createCoord(1, c));
    const loop = new MainLoop(rows, cols, tiles);

    const frames = buildLoopWalkTrace(loop);
    expect(frames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(frames[0]?.distance).toBe(0);
    expect(frames.at(-1)?.distance).toBe(200);
    expect(frames.at(-1)?.discoveredTiles).toBe(400);
    for (let i = 1; i < frames.length; i += 1) {
      expect(frames[i]!.distance).toBeGreaterThan(frames[i - 1]!.distance);
    }
  });

  it('rejects invalid maxSteps options', () => {
    const loop = traceMainLoop(parsePipeMaze('S7\nLJ'));
    expect(() => buildLoopWalkTrace(loop, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildLoopWalkTrace(loop, { maxSteps: -2 })).toThrow(RangeError);
    expect(() => buildLoopWalkTrace(loop, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
