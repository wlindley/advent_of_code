import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = `
Blueprint 1:
  Each ore robot costs 4 ore.
  Each clay robot costs 2 ore.
  Each obsidian robot costs 3 ore and 14 clay.
  Each geode robot costs 2 ore and 7 obsidian.

Blueprint 2:
  Each ore robot costs 2 ore.
  Each clay robot costs 3 ore.
  Each obsidian robot costs 3 ore and 8 clay.
  Each geode robot costs 3 ore and 12 obsidian.
`;

describe('2022 Day 19 Part 1 solver', () => {
  it('solves the official example via executeSolver with a fake Clock', () => {
    let tick = 100;
    const fakeClock: Clock = { nowMs: () => (tick += 12) };
    const exec = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(exec.answer).toBe(33);
    expect(exec.elapsedMs).toBe(12);
    expect(exec.runtime).toBe('main-thread');
  });

  it('produces trace frames with default cap and explicit maxSteps', () => {
    const blueprints = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace!(blueprints);
    expect(full).toHaveLength(50);
    expect(full[full.length - 1]!.finalAggregate).toBe(33);

    const sampled = solver.trace!(blueprints, { maxSteps: 8 });
    expect(sampled).toHaveLength(8);
    expect(sampled[7]!.finalAggregate).toBe(33);
  });

  it('rejects malformed input at parse boundary', () => {
    expect(() => solver.parse('not a blueprint')).toThrow(SyntaxError);
  });
});
