import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  '#.#####################',
  '#.......#########...###',
  '#######.#########.#.###',
  '###.....#.>.>.###.#.###',
  '###v#####.#v#.###.#.###',
  '###.>...#.#.#.....#...#',
  '###v###.#.#.#########.#',
  '###...#.#.#.......#...#',
  '#####.#.#.#######.#.###',
  '#.....#.#.#.......#...#',
  '#.#####.#.#.#########v#',
  '#.#...#...#...###...>.#',
  '#.#.#v#######v###.###v#',
  '#...#.>.#...>.>.#.###.#',
  '#####v#.#.###v#.#.###.#',
  '#.....#...#...#.#.#...#',
  '#.#########.###.#.#.###',
  '#...###...#...#...#.###',
  '###.###.#.###v#####v###',
  '#...#...#.#.>.>.#.>.###',
  '#.###.###.#.###.#.#v###',
  '#.....###...###...#...#',
  '#####################.#',
].join('\n');

describe('AoC 2023 Day 23 Part 1 solver', () => {
  it('parses and finds the 94-step longest icy walk on the official 23x23 example', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(parsed)).toBe(94);
  });

  it('executes via shared runner and builds bounded trace frames', () => {
    const execution = executeSolver(solver, OFFICIAL_EXAMPLE);
    expect(execution.answer).toBe(94);
    expect(execution.runtime).toBe('main-thread');

    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace?.(parsed);
    expect(full?.[0]?.phase).toBe('contracted');
    expect(full?.[full.length - 1]?.distance).toBe(94);

    const bounded = solver.trace?.(parsed, { maxSteps: 4 });
    expect(bounded?.length).toBe(4);
    expect(bounded?.[3]?.isFinal).toBe(true);
    expect(() => solver.trace?.(parsed, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('throws in solve when slopes block all exits while still tracing unreachable', () => {
    const blocked = solver.parse('#.#\n#^#\n#.#');
    expect(() => solver.solve(blocked)).toThrow();
    const frames = solver.trace?.(blocked);
    expect(frames?.[frames.length - 1]?.phase).toBe('unreachable');
  });
});
