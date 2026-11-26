import { describe, expect, it } from 'vitest';
import { DECODED_OUTPUT_SUM_POLICY, UNIQUE_DIGITS_POLICY } from './policy';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DisplayTraceFrame,
  SevenSegmentSolver,
  traceDisplays,
} from './solver';

const OFFICIAL_TEN_ENTRY_EXAMPLE = [
  'be cfbegad cbdgef fgaecd cgeb fdcge agebfd fecdb fabcd edb | fdgacbe cefdb cefbgd gcbe',
  'edbfga begcd cbg gc gcadebf fbgde acbgfd abcde gfcbed gfec | fcgedb cgb dgebacf gc',
  'fgaebd cg bdaec gdafb agbcfd gdcbef bgcad gfac gcb cdgabef | cg cg fdcagb cbg',
  'fbegcd cbd adcefb dageb afcb bc aefdc ecdab fgdeca fcdbega | efabcd cedba gadfec cb',
  'aecbfdg fbg gf bafeg dbefa fcge gcbea fcaegb dgceab fcbdga | gecf egdcabf bgf bfgea',
  'fgeab ca afcebg bdacfeg cfaedg gcfdb baec bfadeg bafgc acf | gebdcfa ecba ca fadegcb',
  'dbcfg fgd bdegcaf fgec aegbdf ecdfab fbedc dacgb gdcebf gf | cefg dcbef fcge gbcadfe',
  'bdfegc cbegaf gecbf dfcage bdacg ed bedf ced adcbefg gebcd | ed bcgafe cdgba cbgef',
  'egadfb cdbfeg cegd fecab cgb gbdefca cg fgcdab egfdb bfceg | gbdfcae bgc cg cgb',
  'gcafb gcf dcaebfg ecagb gf abcdeg gaef cafbge fdbac fegbdc | fgae cfgab fg bagce',
].join('\n');

describe('2021 Day 8 SevenSegmentSolver & trace', () => {
  it('solves the official 10-entry example under both Part 1 and Part 2 policies', () => {
    const part1 = new SevenSegmentSolver(UNIQUE_DIGITS_POLICY);
    const part2 = new SevenSegmentSolver(DECODED_OUTPUT_SUM_POLICY);
    expect(Object.isFrozen(part1)).toBe(true);
    expect(part1.policy).toBe(UNIQUE_DIGITS_POLICY);
    expect(part2.policy).toBe(DECODED_OUTPUT_SUM_POLICY);

    const entries = part1.parse(OFFICIAL_TEN_ENTRY_EXAMPLE);
    expect(entries).toHaveLength(10);
    expect(part1.solve(entries)).toBe(26);
    expect(part2.solve(entries)).toBe(61229);
  });

  it('produces frozen DisplayTraceFrame snapshots with accurate runningTotal and contribution', () => {
    const solver = new SevenSegmentSolver(UNIQUE_DIGITS_POLICY);
    const entries = solver.parse(OFFICIAL_TEN_ENTRY_EXAMPLE);
    const frames = solver.trace(entries);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(64);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(10);

    const first = frames[0]!;
    expect(first).toBeInstanceOf(DisplayTraceFrame);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.entryIndex).toBe(0);
    expect(first.totalEntries).toBe(10);
    expect(first.contribution).toBe(2);
    expect(first.runningTotal).toBe(2);

    const last = frames[frames.length - 1]!;
    expect(last.entryIndex).toBe(9);
    expect(last.runningTotal).toBe(26);
  });

  it('samples large traces to maxSteps, returns empty for zero entries, and validates maxSteps', () => {
    const solver = new SevenSegmentSolver(DECODED_OUTPUT_SUM_POLICY);
    const entries = solver.parse(OFFICIAL_TEN_ENTRY_EXAMPLE);

    const sampled = solver.trace(entries, { maxSteps: 4 });
    expect(sampled).toHaveLength(4);
    expect(sampled[0]!.entryIndex).toBe(0);
    expect(sampled[sampled.length - 1]!.entryIndex).toBe(9);
    expect(sampled[sampled.length - 1]!.runningTotal).toBe(61229);

    const emptyFrames = traceDisplays([], UNIQUE_DIGITS_POLICY);
    expect(Object.isFrozen(emptyFrames)).toBe(true);
    expect(emptyFrames).toEqual([]);

    expect(() => solver.trace(entries, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceDisplays([], UNIQUE_DIGITS_POLICY, { maxSteps: -2 })).toThrow(RangeError);
  });
});
