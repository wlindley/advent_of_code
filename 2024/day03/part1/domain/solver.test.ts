import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { parseCorruptedMemory } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  solver,
  sumMultiplications,
  traceMultiplications,
} from './solver';

const EXAMPLE_INPUT =
  'xmul(2,4)%&mul[3,7]!@^do_not_mul(5,5)+mul(32,64]then(mul(11,8)mul(8,5))';

function createFakeClock(ticks: readonly number[]): Clock {
  let idx = 0;
  return {
    nowMs: () => {
      const value = ticks[idx] ?? ticks[ticks.length - 1]!;
      idx += 1;
      return value;
    },
  };
}

describe('day03/part1 solver', () => {
  it('solves the official example (161) and executes with a fake clock', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(161);

    const exec = executeSolver(solver, EXAMPLE_INPUT, createFakeClock([4, 7.25]));
    expect(exec).toEqual({ answer: 161, elapsedMs: 3.25, runtime: 'main-thread' });
  });

  it('handles empty/noise inputs, operand boundaries, and multi-line streams', () => {
    expect(sumMultiplications(parseCorruptedMemory(''))).toBe(0);
    expect(sumMultiplications(parseCorruptedMemory('noise\nmore noise'))).toBe(0);
    expect(sumMultiplications(parseCorruptedMemory('mul(0,999)'))).toBe(0);
    expect(sumMultiplications(parseCorruptedMemory('mul(999,999)'))).toBe(998_001);
    expect(sumMultiplications(parseCorruptedMemory("mul(2,3)\ndon't()mul(4,5)\ndo()mul(6,7)"))).toBe(68);
  });

  it('traces empty, full, sampled, and bounded runs while validating maxSteps', () => {
    const emptyMem = parseCorruptedMemory('no muls');
    const emptyFrames = traceMultiplications(emptyMem);
    expect(Object.isFrozen(emptyFrames)).toBe(true);
    expect(emptyFrames).toEqual([
      { processedCount: 0, totalMuls: 0, activeMul: null, runningSum: 0 },
    ]);

    const mem = parseCorruptedMemory(EXAMPLE_INPUT);
    const full = traceMultiplications(mem);
    expect(full).toHaveLength(5);
    expect(full[0]).toEqual({ processedCount: 0, totalMuls: 4, activeMul: null, runningSum: 0 });
    expect(full[4]).toMatchObject({ processedCount: 4, totalMuls: 4, runningSum: 161 });
    expect(full[4]!.activeMul).toBe(mem.mulInstructions[3]);
    expect(Object.isFrozen(full[0])).toBe(true);

    const sampled3 = traceMultiplications(mem, { maxSteps: 3 });
    expect(sampled3.map((f) => f.processedCount)).toEqual([0, 2, 4]);
    expect(sampled3[2]!.runningSum).toBe(161);

    const single = traceMultiplications(mem, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.processedCount).toBe(4);
    expect(single[0]!.runningSum).toBe(161);

    const largeRaw = 'mul(2,3)'.repeat(250);
    const largeMem = parseCorruptedMemory(largeRaw);
    const bounded = traceMultiplications(largeMem);
    expect(bounded).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(bounded[bounded.length - 1]!.runningSum).toBe(1500);

    expect(() => traceMultiplications(mem, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceMultiplications(mem, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
