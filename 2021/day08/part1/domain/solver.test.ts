import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { UNIQUE_DIGITS_POLICY } from '../../shared';
import { solver } from './index';

const OFFICIAL_SMALL_EXAMPLE =
  'acedgfb cdfbe gcdfa fbcad dab cefabd cdfgeb eafb cagedb ab | cdfeb fcadb cdfeb cdbaf';

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

describe('2021 Day 8 Part 1 solver', () => {
  it('binds the unique-digits evaluation policy', () => {
    expect(solver.policy).toBe(UNIQUE_DIGITS_POLICY);
  });

  it('solves the official small and 10-entry examples', () => {
    expect(solver.solve(solver.parse(OFFICIAL_SMALL_EXAMPLE))).toBe(0);

    const execution = executeSolver(solver, OFFICIAL_TEN_ENTRY_EXAMPLE);
    expect(execution.answer).toBe(26);
    expect(execution.runtime).toBe('main-thread');
  });

  it('traces entry totals consistently and rejects invalid input or maxSteps', () => {
    const entries = solver.parse(OFFICIAL_TEN_ENTRY_EXAMPLE);
    const frames = solver.trace(entries);
    expect(frames).toHaveLength(10);
    expect(frames[frames.length - 1]!.runningTotal).toBe(26);
    expect(frames[frames.length - 1]!.entryIndex).toBe(9);

    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('bad line')).toThrow(SyntaxError);
    expect(() => solver.trace(entries, { maxSteps: 0 })).toThrow(RangeError);
  });
});
