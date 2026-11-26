import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_TRACE_STEPS, parseDiskMap } from '../../shared';
import {
  BLOCK_COMPACTION_STRATEGY,
  planBlockCompaction,
  solvePart1,
  solver,
  tracePart1,
} from './index';

describe('2024 Day 9 Part 1 solver', () => {
  it('solves official examples via solver.parse and solver.solve', () => {
    expect(solver.solve(solver.parse('12345'))).toBe(60n);
    expect(solver.solve(solver.parse('2333133121414131402'))).toBe(1928n);
    expect(solvePart1(parseDiskMap('90909'))).toBe(513n);
    expect(Object.isFrozen(solver)).toBe(true);
    expect(BLOCK_COMPACTION_STRATEGY.plan).toBe(planBlockCompaction);
  });

  it('handles zero-length files, trailing free spans, and no-move edge cases', () => {
    const cases: readonly [string, bigint][] = [
      ['0', 0n],
      ['5', 0n],
      ['05', 0n],
      ['052', 1n],
      ['1234', 6n],
      ['12325', 60n],
      ['03025', 2n * (0n + 1n + 2n + 3n + 4n)],
      ['230', 0n],
      ['10002', 2n * (1n + 2n)],
    ];
    for (const [raw, expected] of cases) {
      expect(solver.solve(solver.parse(raw))).toBe(expected);
    }
  });

  it('solves a 19,999-digit input quickly and bounds trace frames', () => {
    const largeRaw = Array.from({ length: 19_999 }, (_, i) => String((i * 7 + 3) % 10)).join('');
    const disk = solver.parse(largeRaw);
    const answer = solver.solve(disk);
    expect(answer).toBeGreaterThan(0n);

    const trace = tracePart1(disk);
    expect(trace).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(trace[0]?.appliedMoves).toBe(0);
    expect(trace[trace.length - 1]?.checksum).toBe(answer);

    const smallTrace = solver.trace!(solver.parse('12345'), { maxSteps: 2 });
    expect(smallTrace).toHaveLength(2);
    expect(smallTrace[1]?.checksum).toBe(60n);
  });
});
