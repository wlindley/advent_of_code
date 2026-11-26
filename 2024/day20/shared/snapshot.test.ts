import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { CheatConfig, PART1_EXAMPLE_CONFIG } from './model';
import { parseRacetrack } from './parser';
import {
  buildCheatTrace,
  createRaceConditionSolver,
  DEFAULT_MAX_TRACE_STEPS,
} from './snapshot';

const EXAMPLE_TRACK = [
  '###############',
  '#...#...#.....#',
  '#.#.#.#.#.###.#',
  '#S#...#.#.#...#',
  '#######.#.#.###',
  '#######.#.#...#',
  '#######.#.###.#',
  '###..E#...#...#',
  '###.#######.###',
  '#...###...#...#',
  '#.#####.#.###.#',
  '#.#...#.#.#...#',
  '#.#.#.#.#.#.###',
  '#...#...#...###',
  '###############',
].join('\n');

describe('buildCheatTrace & RaceConditionSnapshot', () => {
  it('builds baseline, sampled cheating, and complete frames with dynamic getters', () => {
    const track = parseRacetrack(EXAMPLE_TRACK);
    const full = buildCheatTrace(track, PART1_EXAMPLE_CONFIG);
    expect(full).toHaveLength(12);
    expect(Object.isFrozen(full[0])).toBe(true);
    expect(full[0]!.phase).toBe('baseline');
    expect(full[0]!.activeCheat).toBeNull();
    expect(full[0]!.activeSaving).toBe(0);
    expect(full[0]!.activeDuration).toBe(0);
    expect(full[0]!.revealedCheatCount).toBe(0);

    expect(full[1]!.phase).toBe('cheating');
    expect(full[1]!.activeSaving).toBe(2);
    expect(full[1]!.activeDuration).toBe(2);
    expect(full[1]!.revealedCheatCount).toBe(14);

    const last = full[full.length - 1]!;
    expect(last.phase).toBe('complete');
    expect(last.activeSaving).toBe(64);
    expect(last.revealedCheatCount).toBe(44);

    const capped = buildCheatTrace(track, PART1_EXAMPLE_CONFIG, { maxSteps: 5 });
    expect(capped).toHaveLength(5);
    expect(capped[0]!.phase).toBe('baseline');
    expect(capped[4]!.phase).toBe('complete');
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(80);
  });

  it('handles limit=1, limit=2, single-bucket, and empty-cheat edge cases', () => {
    const track = parseRacetrack(EXAMPLE_TRACK);

    const one = buildCheatTrace(track, PART1_EXAMPLE_CONFIG, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.phase).toBe('complete');
    expect(one[0]!.activeSaving).toBe(64);

    const two = buildCheatTrace(track, PART1_EXAMPLE_CONFIG, { maxSteps: 2 });
    expect(two.map((f) => f.phase)).toEqual(['baseline', 'complete']);

    const uBend = parseRacetrack('S#E\n...');
    const singleBucket = buildCheatTrace(uBend, new CheatConfig(2, 2));
    expect(singleBucket.map((f) => f.phase)).toEqual(['baseline', 'complete']);
    expect(singleBucket[1]!.revealedCheatCount).toBe(1);

    const empty = buildCheatTrace(parseRacetrack('S#E'), new CheatConfig(2, 1));
    expect(empty.map((f) => f.phase)).toEqual(['baseline', 'complete']);
    expect(empty[1]!.activeCheat).toBeNull();
    expect(empty[1]!.revealedCheatCount).toBe(0);
  });
});

describe('createRaceConditionSolver', () => {
  it('parses, solves, and traces via PuzzleSolver contract', () => {
    const solver = createRaceConditionSolver(PART1_EXAMPLE_CONFIG);
    const run = executeSolver(solver, EXAMPLE_TRACK);
    expect(run.answer).toBe(44);

    const parsed = solver.parse(EXAMPLE_TRACK);
    const trace = solver.trace!(parsed, { maxSteps: 6 });
    expect(trace).toHaveLength(6);
    expect(trace[5]!.revealedCheatCount).toBe(44);
  });
});
