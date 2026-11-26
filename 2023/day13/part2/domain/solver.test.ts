import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { createIncidenceSolver } from '../../shared';
import { PART2_TARGET_SMUDGES, solver } from './index';

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

class FakeClock implements Clock {
  private tick = 10;

  nowMs(): number {
    const current = this.tick;
    this.tick += 7;
    return current;
  }
}

describe('2023 Day 13 Part 2 solver', () => {
  it('fixes PART2_TARGET_SMUDGES to 1 and exports a frozen solver', () => {
    expect(PART2_TARGET_SMUDGES).toBe(1);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(() => createIncidenceSolver(-1)).toThrow(RangeError);
  });

  it('solves the official example to 400 and reports elapsed time via executeSolver', () => {
    const execution = executeSolver(solver, OFFICIAL_EXAMPLE, new FakeClock());
    expect(execution.answer).toBe(400);
    expect(execution.elapsedMs).toBe(7);
    expect(execution.runtime).toBe('main-thread');
  });

  it('produces sampled trace frames with smudge pairs and honors maxSteps', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    const fullTrace = solver.trace?.(parsed) ?? [];
    const oneTrace = solver.trace?.(parsed, { maxSteps: 1 }) ?? [];

    expect(fullTrace).toHaveLength(2);
    expect(fullTrace[0]!.match.orientation).toBe('horizontal');
    expect(fullTrace[0]!.match.index).toBe(3);
    expect(fullTrace[0]!.match.score).toBe(300);
    expect(fullTrace[0]!.match.mismatches).toEqual([
      { near: { row: 0, col: 0 }, far: { row: 5, col: 0 } },
    ]);
    expect(fullTrace[0]!.cumulativeScore).toBe(300);

    expect(fullTrace[1]!.match.orientation).toBe('horizontal');
    expect(fullTrace[1]!.match.index).toBe(1);
    expect(fullTrace[1]!.match.score).toBe(100);
    expect(fullTrace[1]!.match.mismatches).toEqual([
      { near: { row: 0, col: 4 }, far: { row: 1, col: 4 } },
    ]);
    expect(fullTrace[1]!.cumulativeScore).toBe(400);

    expect(oneTrace).toHaveLength(1);
    expect(oneTrace[0]!.cumulativeScore).toBe(400);
  });

  it('rejects empty or whitespace-only input with RangeError', () => {
    expect(() => solver.parse('   \n  ')).toThrow(RangeError);
  });

  it('rejects patterns with zero smudge-1 reflection axes', () => {
    expect(() => solver.solve(solver.parse('.'))).toThrow(Error);
    expect(() => solver.solve(solver.parse('##\n##'))).toThrow(Error);
  });

  it('rejects patterns with ambiguous smudge-1 reflection axes', () => {
    expect(() => solver.solve(solver.parse('.#.\n###'))).toThrow(Error);
  });
});
