import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { parseLabMap } from '../../shared';
import {
  countLoopObstructions,
  DEFAULT_MAX_TRACE_STEPS,
  findLoopObstructions,
  LoopCandidateFrame,
  solver,
  traceLoopObstructions,
} from './index';

const EXAMPLE_RAW = [
  '....#.....',
  '.........#',
  '..........',
  '..#.......',
  '.......#..',
  '..........',
  '.#..^.....',
  '........#.',
  '#.........',
  '......#...',
].join('\n');

const ZERO_LOOP_RAW = ['..', '^.'].join('\n');

const BASELINE_LOOP_RAW = ['.#...', '....#', '.^...', '#....', '...#.'].join('\n');

const SAMPLE_APPROACH = [{ row: 0, col: 0 }];
const SAMPLE_CYCLE = [
  { row: 0, col: 0 },
  { row: 0, col: 2 },
  { row: 3, col: 2 },
  { row: 3, col: 0 },
  { row: 0, col: 0 },
];

describe('LoopCandidateFrame', () => {
  it('computes cycleTurns and cycleSteps dynamically and freezes instances', () => {
    const frame = new LoopCandidateFrame(0, 2, { row: 1, col: 1 }, SAMPLE_APPROACH, SAMPLE_CYCLE);
    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.obstruction)).toBe(true);
    expect(Object.isFrozen(frame.approachVertices)).toBe(true);
    expect(Object.isFrozen(frame.cycleVertices)).toBe(true);
    expect(frame.candidateIndex).toBe(0);
    expect(frame.totalCandidates).toBe(2);
    expect(frame.obstruction).toEqual({ row: 1, col: 1 });
    expect(frame.cycleTurns).toBe(4);
    expect(frame.cycleSteps).toBe(14); // (2 + 3 + 2 + 3) moves + 4 turns
  });

  it('validates each constructor invariant independently', () => {
    const obs = { row: 0, col: 1 };
    expect(() => new LoopCandidateFrame(0, 0, obs, SAMPLE_APPROACH, SAMPLE_CYCLE)).toThrow(RangeError);
    expect(() => new LoopCandidateFrame(0, 1.5, obs, SAMPLE_APPROACH, SAMPLE_CYCLE)).toThrow(RangeError);
    expect(() => new LoopCandidateFrame(-1, 2, obs, SAMPLE_APPROACH, SAMPLE_CYCLE)).toThrow(RangeError);
    expect(() => new LoopCandidateFrame(2, 2, obs, SAMPLE_APPROACH, SAMPLE_CYCLE)).toThrow(RangeError);
    expect(() => new LoopCandidateFrame(0.5, 2, obs, SAMPLE_APPROACH, SAMPLE_CYCLE)).toThrow(RangeError);
    expect(() => new LoopCandidateFrame(0, 1, obs, [], SAMPLE_CYCLE)).toThrow(RangeError);
    expect(() => new LoopCandidateFrame(0, 1, obs, SAMPLE_APPROACH, [{ row: 0, col: 0 }])).toThrow(RangeError);
    expect(
      () => new LoopCandidateFrame(0, 1, obs, SAMPLE_APPROACH, [{ row: 0, col: 0 }, { row: 1, col: 0 }]),
    ).toThrow(RangeError);
    expect(
      () => new LoopCandidateFrame(0, 1, obs, SAMPLE_APPROACH, [{ row: 0, col: 0 }, { row: 0, col: 1 }]),
    ).toThrow(RangeError);
  });
});

describe('Day 6 Part 2 solver', () => {
  it('finds and counts loop obstructions across official, zero-loop, and baseline-loop maps', () => {
    const exampleMap = parseLabMap(EXAMPLE_RAW);
    expect(findLoopObstructions(exampleMap)).toHaveLength(6);
    expect(countLoopObstructions(exampleMap)).toBe(6);

    const zeroMap = parseLabMap(ZERO_LOOP_RAW);
    expect(findLoopObstructions(zeroMap)).toEqual([]);
    expect(countLoopObstructions(zeroMap)).toBe(0);

    const loopMap = parseLabMap(BASELINE_LOOP_RAW);
    expect(countLoopObstructions(loopMap)).toBeGreaterThan(0);
  });

  it('traces sampled LoopCandidateFrames and validates maxSteps upfront', () => {
    const map = parseLabMap(EXAMPLE_RAW);
    const full = traceLoopObstructions(map);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    expect(Object.isFrozen(full)).toBe(true);
    expect(full).toHaveLength(6);
    expect(full[0]!.candidateIndex).toBe(0);
    expect(full[5]!.candidateIndex).toBe(5);
    expect(full[0]!.cycleTurns).toBeGreaterThanOrEqual(4);

    const sampled3 = traceLoopObstructions(map, { maxSteps: 3 });
    expect(sampled3.map((f) => f.candidateIndex)).toEqual([0, 3, 5]);

    const sampled1 = traceLoopObstructions(map, { maxSteps: 1 });
    expect(sampled1.map((f) => f.candidateIndex)).toEqual([5]);

    const zeroMap = parseLabMap(ZERO_LOOP_RAW);
    expect(traceLoopObstructions(zeroMap)).toEqual([]);
    expect(() => traceLoopObstructions(map, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceLoopObstructions(zeroMap, { maxSteps: -1 })).toThrow(RangeError);
  });

  it('runs through executeSolver with a hand-written fake Clock', () => {
    const ticks = [10, 23.5];
    let index = 0;
    const fakeClock: Clock = {
      nowMs: () => ticks[index++] ?? 23.5,
    };
    const execution = executeSolver(solver, EXAMPLE_RAW, fakeClock);
    expect(execution).toEqual({ answer: 6, elapsedMs: 13.5, runtime: 'main-thread' });
  });
});
