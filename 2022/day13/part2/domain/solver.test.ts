import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { parsePacket, parseSignalInput, traceComparison } from '../../shared';
import {
  buildPart2Trace,
  classifyPacket,
  DEFAULT_MAX_TRACE_STEPS,
  DIVIDER_FIRST,
  DIVIDER_SECOND,
  DividerTraceFrame,
  solvePart2,
  solver,
} from './index';

const EXAMPLE_INPUT = [
  '[1,1,3,1,1]',
  '[1,1,5,1,1]',
  '',
  '[[1],[2,3,4]]',
  '[[1],4]',
  '',
  '[9]',
  '[[8,7,6]]',
  '',
  '[[4,4],4,4]',
  '[[4,4],4,4,4]',
  '',
  '[7,7,7,7]',
  '[7,7,7]',
  '',
  '[]',
  '[3]',
  '',
  '[[[]]]',
  '[[]]',
  '',
  '[1,[2,[3,[4,[5,6,7]]]],8,9]',
  '[1,[2,[3,[4,[5,6,0]]]],8,9]',
].join('\n');

function fakeClock(ticks: readonly number[]): Clock {
  let idx = 0;
  return { nowMs: () => ticks[idx++] ?? ticks[ticks.length - 1] ?? 0 };
}

describe('2022 Day 13 Part 2 domain solver', () => {
  it('solves the official example to 140 and executes via executeSolver', () => {
    const parsed = parseSignalInput(EXAMPLE_INPUT);
    expect(solvePart2(parsed)).toBe(140);

    const exec = executeSolver(solver, EXAMPLE_INPUT, fakeClock([10, 14]));
    expect(exec.answer).toBe(140);
    expect(exec.elapsedMs).toBe(4);
    expect(exec.runtime).toBe('main-thread');

    const trace = solver.trace!(parsed);
    expect(trace).toHaveLength(16);
    const last = trace[trace.length - 1]!;
    expect(last.firstDividerIndex).toBe(10);
    expect(last.secondDividerIndex).toBe(14);
    expect(last.beforeFirstCount).toBe(9);
    expect(last.betweenCount).toBe(3);
    expect(last.afterSecondCount).toBe(4);
    expect(last.decoderKey).toBe(140);
    expect(last.isComplete).toBe(true);
  });

  it('classifies packets across < [[2]], === [[2]], between, === [[6]], and > [[6]]', () => {
    expect(classifyPacket(parsePacket('[]'))).toBe('before-first');
    expect(classifyPacket(parsePacket('[[1]]'))).toBe('before-first');
    expect(classifyPacket(parsePacket('[2]'))).toBe('between');
    expect(classifyPacket(parsePacket('[[2]]'))).toBe('between');
    expect(classifyPacket(parsePacket('[[[2]]]'))).toBe('between');
    expect(classifyPacket(parsePacket('[3]'))).toBe('between');
    expect(classifyPacket(parsePacket('[6]'))).toBe('after-second');
    expect(classifyPacket(parsePacket('[[6]]'))).toBe('after-second');
    expect(classifyPacket(parsePacket('[[[6]]]'))).toBe('after-second');
    expect(classifyPacket(parsePacket('[7]'))).toBe('after-second');
  });

  it('handles extreme distributions (all before-first, all between, all after-second)', () => {
    expect(solvePart2(parseSignalInput('[]\n[1]'))).toBe(3 * 4);
    expect(solvePart2(parseSignalInput('[3]\n[4]'))).toBe(1 * 4);
    expect(solvePart2(parseSignalInput('[7]\n[8]'))).toBe(1 * 2);
  });

  it('builds frozen bounded traces with short-circuit and fallthrough comparisons', () => {
    const parsed = parseSignalInput(EXAMPLE_INPUT);
    const full = buildPart2Trace(parsed);
    expect(full).toHaveLength(16);
    expect(Object.isFrozen(full)).toBe(true);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(150);

    const firstFrame = full[0]!;
    expect(Object.isFrozen(firstFrame)).toBe(true);
    expect(Object.isFrozen(firstFrame.bands)).toBe(true);
    expect(firstFrame.band).toBe('before-first');
    expect(firstFrame.secondComparison).toBeNull();
    expect(firstFrame.decidingDivider).toBe(DIVIDER_FIRST);
    expect(firstFrame.decidingComparison).toBe(firstFrame.firstComparison);
    expect(firstFrame.isComplete).toBe(false);

    const afterFrame = full[4]!;
    expect(afterFrame.band).toBe('after-second');
    expect(afterFrame.secondComparison).not.toBeNull();
    expect(afterFrame.decidingDivider).toBe(DIVIDER_SECOND);
    expect(afterFrame.decidingComparison).toBe(afterFrame.secondComparison);

    const sampled = buildPart2Trace(parsed, { maxSteps: 4 });
    expect(sampled).toHaveLength(4);
    expect(sampled[0]!.packetIndex).toBe(1);
    expect(sampled[3]!.packetIndex).toBe(16);

    const single = buildPart2Trace(parsed, { maxSteps: 1 });
    expect(single).toHaveLength(1);
    expect(single[0]!.packetIndex).toBe(16);

    expect(() => buildPart2Trace(parsed, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildPart2Trace(parsed, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('enforces all DividerTraceFrame constructor invariants', () => {
    const pBefore = parsePacket('[1]');
    const pBetween = parsePacket('[3]');
    const pAfter = parsePacket('[7]');
    const cBefore1 = traceComparison(pBefore, DIVIDER_FIRST);
    const cBefore2 = traceComparison(pBefore, DIVIDER_SECOND);
    const cBetween1 = traceComparison(pBetween, DIVIDER_FIRST);
    const cBetween2 = traceComparison(pBetween, DIVIDER_SECOND);
    const cAfter1 = traceComparison(pAfter, DIVIDER_FIRST);
    const cAfter2 = traceComparison(pAfter, DIVIDER_SECOND);

    expect(() => new DividerTraceFrame(1, 0, pBefore, cBefore1, null, ['before-first'])).toThrow(RangeError);
    expect(() => new DividerTraceFrame(1, 1.5, pBefore, cBefore1, null, ['before-first'])).toThrow(RangeError);
    expect(() => new DividerTraceFrame(0, 2, pBefore, cBefore1, null, [])).toThrow(RangeError);
    expect(() => new DividerTraceFrame(1.5, 2, pBefore, cBefore1, null, ['before-first'])).toThrow(RangeError);
    expect(() => new DividerTraceFrame(3, 2, pBefore, cBefore1, null, ['before-first', 'before-first', 'before-first'])).toThrow(RangeError);
    expect(() => new DividerTraceFrame(2, 2, pBefore, cBefore1, null, ['before-first'])).toThrow(RangeError);

    expect(() => new DividerTraceFrame(1, 1, pBefore, cBefore1, cBefore2, ['before-first'])).toThrow(Error);
    expect(() => new DividerTraceFrame(1, 1, pBefore, cBefore1, null, ['between'])).toThrow(Error);
    expect(() => new DividerTraceFrame(1, 1, pBetween, cBetween1, null, ['between'])).toThrow(Error);
    expect(() => new DividerTraceFrame(1, 1, pBetween, cBetween1, cBetween2, ['after-second'])).toThrow(Error);
    expect(() => new DividerTraceFrame(1, 1, pAfter, cAfter1, cAfter2, ['between'])).toThrow(Error);
  });
});
