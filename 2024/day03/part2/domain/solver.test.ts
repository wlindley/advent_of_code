import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { parseCorruptedMemory } from '../../shared';
import {
  computeInstructionStates,
  DEFAULT_MAX_TRACE_STEPS,
  solver,
  sumEnabledMultiplications,
  traceConditionalMultiplications,
} from '.';

const EXAMPLE_INPUT =
  "xmul(2,4)&mul[3,7]!^don't()_mul(5,5)+mul(32,64](mul(11,8)undo()?mul(8,5))";

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

function streamingSkipOracle(raw: string): number {
  const mulRegex = /mul\((\d{1,3}),(\d{1,3})\)/g;
  let pos = 0;
  let enabled = true;
  let total = 0;
  while (pos < raw.length) {
    if (enabled) {
      const stop = raw.indexOf("don't()", pos);
      const end = stop === -1 ? raw.length : stop;
      for (const m of raw.slice(pos, end).matchAll(mulRegex)) total += Number(m[1]) * Number(m[2]);
      if (stop === -1) break;
      pos = stop + 7;
      enabled = false;
    } else {
      const resume = raw.indexOf('do()', pos);
      if (resume === -1) break;
      pos = resume + 4;
      enabled = true;
    }
  }
  return total;
}

function buildSyntheticCorpus(targetBytes: number): string {
  const frags = ['mul(2,3)', 'mul(999,1)', "don't()", 'do()', 'mul(12,34', 'don’t()', '\n', '#@!'];
  let state = 0x12345678;
  let out = '';
  while (out.length < targetBytes) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    out += frags[state % frags.length]!;
  }
  return out;
}

describe('day03/part2 solver', () => {
  it('solves the official example (48) and executes with a fake clock', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(parsed)).toBe(48);
    expect(executeSolver(solver, EXAMPLE_INPUT, createFakeClock([10, 14.5]))).toEqual({
      answer: 48,
      elapsedMs: 4.5,
      runtime: 'main-thread',
    });
  });

  it('matches independent streaming oracle across edge cases and ~20 KB corpus', () => {
    const cases: readonly [string, number][] = [
      ['', 0], ['noise\nmore noise', 0], ["do()don't()do()", 0],
      ['mul(2,3)mul(4,5)', 26], ["don't()mul(2,3)", 0], ["mul(3,4)don't()do()", 12],
      ["don't()don't()mul(2,3)do()do()mul(4,5)", 20], ["don't()\nmul(5,5)\ndo()\nmul(2,6)", 12],
      ['mul(0,999)mul(999,999)', 998_001], ["don't(mul(2,3))", 6],
      ["mul(1,don't())mul(2,3)", 0], ["don't()mul(1,do())mul(2,3)", 6], ['do(mul(2,3))', 6],
    ];
    for (const [raw, expected] of cases) {
      expect(sumEnabledMultiplications(parseCorruptedMemory(raw))).toBe(expected);
      expect(streamingSkipOracle(raw)).toBe(expected);
    }
    const corpus = buildSyntheticCorpus(20_480);
    expect(sumEnabledMultiplications(parseCorruptedMemory(corpus))).toBe(streamingSkipOracle(corpus));
  });

  it('computes frozen instruction gate states aligned 1:1 with instructions', () => {
    const emptyStates = computeInstructionStates(parseCorruptedMemory('noise'));
    expect(Object.isFrozen(emptyStates)).toBe(true);
    expect(emptyStates).toEqual([]);
    const states = computeInstructionStates(parseCorruptedMemory(EXAMPLE_INPUT));
    expect(Object.isFrozen(states)).toBe(true);
    expect(states).toEqual([true, false, false, false, true, true]);
  });

  it('traces empty, full, sampled, and bounded runs while validating maxSteps', () => {
    const emptyFrames = traceConditionalMultiplications(parseCorruptedMemory('no tokens'));
    expect(Object.isFrozen(emptyFrames)).toBe(true);
    expect(emptyFrames).toEqual([{
      processedCount: 0, totalInstructions: 0, activeInstruction: null,
      enabled: true, executedMulCount: 0, skippedMulCount: 0, runningSum: 0,
    }]);
    const mem = parseCorruptedMemory(EXAMPLE_INPUT);
    const full = traceConditionalMultiplications(mem);
    expect(full).toHaveLength(7);
    expect(Object.isFrozen(full[0])).toBe(true);
    expect(full[4]).toMatchObject({ enabled: false, executedMulCount: 1, skippedMulCount: 2, runningSum: 8 });
    expect(full[6]).toMatchObject({
      processedCount: 6, totalInstructions: 6, enabled: true, executedMulCount: 2, skippedMulCount: 2, runningSum: 48,
      activeInstruction: mem.instructions[5],
    });
    expect(traceConditionalMultiplications(mem, { maxSteps: 3 }).map((f) => f.processedCount)).toEqual([0, 3, 6]);
    const single = traceConditionalMultiplications(mem, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]).toMatchObject({ processedCount: 6, runningSum: 48 });
    const bounded = traceConditionalMultiplications(parseCorruptedMemory("mul(2,3)don't()mul(4,5)do()".repeat(70)));
    expect(bounded).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(bounded[bounded.length - 1]!.runningSum).toBe(420);
    for (const bad of [0, -1, 1.5, Number.NaN]) {
      expect(() => traceConditionalMultiplications(mem, { maxSteps: bad })).toThrow(RangeError);
    }
  });
});
