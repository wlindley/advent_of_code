import { describe, expect, it } from 'vitest';
import { CubeNetTopology } from './cubeNetTopology';
import { FlatTorusTopology } from './flatTorusTopology';
import { parseMonkeyMap } from './parser';
import { computePassword } from './types';
import { DEFAULT_TRACE_MAX_STEPS, traceMonkeyMap, walkMonkeyMap } from './walker';

const OFFICIAL_EXAMPLE = [
  '        ...#',
  '        .#..',
  '        #...',
  '        ....',
  '...#.......#',
  '........#...',
  '..#....#....',
  '..........#.',
  '        ...#....',
  '        .....#..',
  '        .#......',
  '        ......#.',
  '',
  '10R5L5R10L4R5L5',
].join('\n');

describe('walker', () => {
  it('solves the official example for Part 1 FlatTorusTopology (6032)', () => {
    const input = parseMonkeyMap(OFFICIAL_EXAMPLE);
    const pose = walkMonkeyMap(input, new FlatTorusTopology(input.board));
    expect(pose).toEqual({ row: 5, col: 7, facing: 0 });
    expect(computePassword(pose)).toBe(6032);
  });

  it('solves the official example for Part 2 CubeNetTopology (5031)', () => {
    const input = parseMonkeyMap(OFFICIAL_EXAMPLE);
    const pose = walkMonkeyMap(input, new CubeNetTopology(input.board));
    expect(pose).toEqual({ row: 4, col: 6, facing: 3 });
    expect(computePassword(pose)).toBe(5031);
  });

  it('preserves pre-wrap facing when blocked by a wall across a cube seam', () => {
    // S=1 cross net: top (0,1) is '.', right (1,2) is '#'. Stepping > wraps onto (1,2) and blocks.
    const seamBlocked = parseMonkeyMap([' . ', '..#', ' . ', ' . ', '', '1'].join('\n'));
    const pose = walkMonkeyMap(seamBlocked, new CubeNetTopology(seamBlocked.board));
    expect(pose).toEqual({ row: 0, col: 1, facing: 0 });
  });

  it('builds bounded trace sharing one frozen trail array and matching walkMonkeyMap', () => {
    const input = parseMonkeyMap(OFFICIAL_EXAMPLE);
    const topo = new FlatTorusTopology(input.board);
    const frames = traceMonkeyMap(input, topo);

    expect(DEFAULT_TRACE_MAX_STEPS).toBe(240);
    expect(frames).toHaveLength(14);
    expect(frames[0]?.pose).toEqual({ row: 0, col: 8, facing: 0 });
    expect(frames[0]?.trailCount).toBe(0);
    expect(frames[0]?.stepText).toBe('Start');
    expect(frames[1]?.blockedByWall).toBe(true);
    expect(frames[13]?.pose).toEqual(walkMonkeyMap(input, topo));
    expect(Object.isFrozen(frames)).toBe(true);
    expect(Object.isFrozen(frames[0]?.trail)).toBe(true);
    expect(frames[0]?.trail).toBe(frames[13]?.trail);
    expect(frames.some((f) => f.lastWrap !== null)).toBe(true);
  });

  it('handles 0-distance moves, post-wrap segments, maxSteps sampling, and invalid maxSteps', () => {
    const input = parseMonkeyMap(['... ', '....', '', '0R1L1L1'].join('\n'));
    const topo = new FlatTorusTopology(input.board);
    const all = traceMonkeyMap(input, topo);
    expect(all[1]?.stepText).toBe('Move 0');
    expect(all[all.length - 1]?.pose).toEqual(walkMonkeyMap(input, topo));

    const sampled = traceMonkeyMap(input, topo, { maxSteps: 3 });
    expect(sampled).toHaveLength(3);
    expect(sampled[0]?.stepText).toBe('Start');
    expect(sampled[2]?.pose).toEqual(walkMonkeyMap(input, topo));

    expect(() => traceMonkeyMap(input, topo, { maxSteps: 0 })).toThrow(RangeError);
  });
});
