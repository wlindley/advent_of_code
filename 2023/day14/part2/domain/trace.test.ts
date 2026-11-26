import { describe, expect, it } from 'vitest';
import { parseDishPlatform } from '../../shared';
import { analyzeSpinCycles, DEFAULT_TARGET_CYCLES } from './cycle';
import {
  buildTraceFromAnalysis,
  DEFAULT_MAX_TRACE_STEPS,
  traceSpinCycles,
} from './trace';

const EXAMPLE = [
  'O....#....',
  'O.OO#....#',
  '.....##...',
  'OO.#O....O',
  '.O.....O#.',
  'O.#..O.#.#',
  '..O..#O..O',
  '.......O..',
  '#....###..',
  '#OO..#....',
].join('\n');

describe('2023/day14/part2/domain/trace', () => {
  it('traces the official example into 12 frozen frames ending with closure and projection', () => {
    const trace = traceSpinCycles(parseDishPlatform(EXAMPLE));
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
    expect(trace).toHaveLength(12);
    expect(Object.isFrozen(trace)).toBe(true);
    for (const frame of trace) {
      expect(Object.isFrozen(frame)).toBe(true);
    }

    expect(trace.map((f) => [f.step, f.cycle, f.phase, f.matchedCycle])).toEqual([
      [0, 0, 'initial', null],
      [1, 1, 'transient', null],
      [2, 2, 'transient', null],
      [3, 3, 'cycle', null],
      [4, 4, 'cycle', null],
      [5, 5, 'cycle', null],
      [6, 6, 'cycle', null],
      [7, 7, 'cycle', null],
      [8, 8, 'cycle', null],
      [9, 9, 'cycle', null],
      [10, 10, 'closure', 3],
      [11, DEFAULT_TARGET_CYCLES, 'projection', 6],
    ]);
    expect(trace[10]!.platform.fingerprint()).toBe(trace[3]!.platform.fingerprint());
    expect(trace[11]!.platform.northLoad).toBe(64);
  });

  it('produces 3 frames for an immediate fixed point', () => {
    const trace = traceSpinCycles(parseDishPlatform('...'));
    expect(trace.map((f) => [f.step, f.cycle, f.phase, f.matchedCycle])).toEqual([
      [0, 0, 'initial', null],
      [1, 1, 'closure', 0],
      [2, DEFAULT_TARGET_CYCLES, 'projection', 0],
    ]);
  });

  it('handles acyclic targets 0 and 2 without closure or projection frames', () => {
    const example = parseDishPlatform(EXAMPLE);
    const zero = traceSpinCycles(example, undefined, 0);
    expect(zero.map((f) => [f.step, f.cycle, f.phase, f.matchedCycle])).toEqual([
      [0, 0, 'initial', null],
    ]);

    const two = traceSpinCycles(example, undefined, 2);
    expect(two.map((f) => [f.step, f.cycle, f.phase, f.matchedCycle])).toEqual([
      [0, 0, 'initial', null],
      [1, 1, 'transient', null],
      [2, 2, 'transient', null],
    ]);
  });

  it('bounds cyclic traces for maxSteps 1, 2, and 5 via buildTraceFromAnalysis', () => {
    const analysis = analyzeSpinCycles(parseDishPlatform(EXAMPLE));

    const one = buildTraceFromAnalysis(analysis, { maxSteps: 1 });
    expect(one.map((f) => [f.step, f.cycle, f.phase, f.matchedCycle])).toEqual([
      [0, DEFAULT_TARGET_CYCLES, 'projection', 6],
    ]);

    const two = buildTraceFromAnalysis(analysis, { maxSteps: 2 });
    expect(two.map((f) => [f.step, f.cycle, f.phase, f.matchedCycle])).toEqual([
      [0, 0, 'initial', null],
      [1, DEFAULT_TARGET_CYCLES, 'projection', 6],
    ]);

    const five = buildTraceFromAnalysis(analysis, { maxSteps: 5 });
    expect(five.map((f) => [f.step, f.cycle, f.phase, f.matchedCycle])).toEqual([
      [0, 0, 'initial', null],
      [1, 5, 'cycle', null],
      [2, 9, 'cycle', null],
      [3, 10, 'closure', 3],
      [4, DEFAULT_TARGET_CYCLES, 'projection', 6],
    ]);
  });

  it('bounds acyclic traces when history exceeds maxSteps', () => {
    const analysis = analyzeSpinCycles(parseDishPlatform(EXAMPLE), 5);
    const sampled = buildTraceFromAnalysis(analysis, { maxSteps: 3 });
    expect(sampled.map((f) => [f.step, f.cycle, f.phase, f.matchedCycle])).toEqual([
      [0, 0, 'initial', null],
      [1, 3, 'transient', null],
      [2, 5, 'transient', null],
    ]);
  });

  it.each([0, -1, 2.5])('rejects invalid maxSteps %s', (bad) => {
    const analysis = analyzeSpinCycles(parseDishPlatform('...'));
    expect(() => buildTraceFromAnalysis(analysis, { maxSteps: bad })).toThrow(RangeError);
  });
});
