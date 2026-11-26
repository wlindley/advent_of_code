import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { PART1_BUTTON_PRESSES, PART1_TRACE_PRESSES, solver } from './index';

const EXAMPLE_1 = [
  'broadcaster -> a, b, c',
  '%a -> b',
  '%b -> c',
  '%c -> inv',
  '&inv -> a',
].join('\n');

const EXAMPLE_2 = [
  'broadcaster -> a',
  '%a -> inv, con',
  '&inv -> b',
  '%b -> con',
  '&con -> output',
].join('\n');

describe('Day 20 Part 1 solver', () => {
  it('solves Example 1 (32000000n) and Example 2 (11687500n) via executeSolver with fake Clock', () => {
    expect(PART1_BUTTON_PRESSES).toBe(1000);
    expect(PART1_TRACE_PRESSES).toBe(4);

    let now = 5;
    const fakeClock: Clock = { nowMs: () => (now += 7) };
    expect(executeSolver(solver, EXAMPLE_1, fakeClock)).toEqual({
      answer: 32_000_000n,
      elapsedMs: 7,
      runtime: 'main-thread',
    });
    expect(executeSolver(solver, EXAMPLE_2, fakeClock)).toEqual({
      answer: 11_687_500n,
      elapsedMs: 7,
      runtime: 'main-thread',
    });
  });

  it('produces bounded traces with omitted options and explicit maxSteps', () => {
    const bp = solver.parse(EXAMPLE_2);
    const full = solver.trace?.(bp) ?? [];
    expect(full).toHaveLength(29);
    expect(full[28]?.lowTotal).toBe(17);
    expect(full[28]?.highTotal).toBe(11);

    const sampled = solver.trace?.(bp, { maxSteps: 10 }) ?? [];
    expect(sampled).toHaveLength(10);
    expect(sampled[0]?.stepIndex).toBe(0);
    expect(sampled[9]?.stepIndex).toBe(28);
  });

  it('rejects invalid raw circuit input', () => {
    expect(() => solver.parse('invalid line')).toThrow();
  });
});
