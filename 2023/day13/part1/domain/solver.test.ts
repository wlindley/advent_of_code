import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { createIncidenceSolver } from '../../shared';
import { PART1_TARGET_SMUDGES, solver } from './index';

const OFFICIAL_EXAMPLE = [
  '#.##..##.',
  '..#.##.#.',
  '##......#',
  '##......#',
  '..#.##.#.',
  '..##..##.',
  '#.#.##.#.',
  '',
  '#...##..#',
  '#....#..#',
  '..##..###',
  '#####.##.',
  '#####.##.',
  '..##..###',
  '#....#..#',
].join('\n');

describe('2023 Day 13 Part 1 solver', () => {
  it('fixes PART1_TARGET_SMUDGES to 0 and exports a frozen solver', () => {
    expect(PART1_TARGET_SMUDGES).toBe(0);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(() => createIncidenceSolver(-1)).toThrow(RangeError);
  });

  it('solves the official example to 405 and reports elapsed time via executeSolver', () => {
    let tick = 10;
    const fakeClock: Clock = {
      nowMs: () => {
        const current = tick;
        tick += 7;
        return current;
      },
    };

    const execution = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(execution.answer).toBe(405);
    expect(execution.elapsedMs).toBe(7);
    expect(execution.runtime).toBe('main-thread');
  });

  it('produces sampled trace frames and rejects invalid inputs', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    const fullTrace = solver.trace?.(parsed) ?? [];
    const oneTrace = solver.trace?.(parsed, { maxSteps: 1 }) ?? [];

    expect(fullTrace).toHaveLength(2);
    expect(fullTrace[0]!.match.score).toBe(5);
    expect(fullTrace[1]!.cumulativeScore).toBe(405);
    expect(oneTrace).toHaveLength(1);
    expect(oneTrace[0]!.cumulativeScore).toBe(405);

    expect(() => solver.parse('   ')).toThrow(RangeError);
    expect(() => solver.solve(solver.parse('#.#\n.#.\n..#'))).toThrow(Error);
  });
});
