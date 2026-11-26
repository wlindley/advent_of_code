import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { DECODED_OUTPUT_SUM_POLICY } from '../../shared';
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

const CANONICAL_SIGNALS = 'abcefg cf acdeg acdfg bcdf abdfg abdefg acf abcdefg abcdfg';
const CANONICAL_DIGITS = CANONICAL_SIGNALS.split(' ');
const CANONICAL_MAP = new Map(CANONICAL_DIGITS.map((pattern, digit) => [pattern, digit]));
const WIRE_BASE = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

interface PrngState {
  seed: number;
}

function nextRand(state: PrngState): number {
  state.seed = (Math.imul(state.seed, 1664525) + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

function shuffleArray<T>(items: readonly T[], state: PrngState): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(nextRand(state) * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy;
}

function translatePattern(pattern: string, mapChars: readonly string[]): string {
  const chars: string[] = [];
  for (let i = 0; i < pattern.length; i += 1) chars.push(mapChars[pattern.charCodeAt(i) - 97]!);
  return chars.sort().join('');
}

function encodeToken(canonical: string, perm: readonly string[], state: PrngState): string {
  return shuffleArray(translatePattern(canonical, perm).split(''), state).join('');
}

function buildSyntheticCase(state: PrngState): { line: string; expected: number } {
  const perm = shuffleArray(WIRE_BASE, state);
  const encodedSignals = shuffleArray(CANONICAL_DIGITS, state).map((s) => encodeToken(s, perm, state));
  let expected = 0;
  const encodedOutputs: string[] = [];
  for (let i = 0; i < 4; i += 1) {
    const digit = Math.floor(nextRand(state) * 10);
    expected = expected * 10 + digit;
    encodedOutputs.push(encodeToken(CANONICAL_DIGITS[digit]!, perm, state));
  }
  return { line: `${encodedSignals.join(' ')} | ${encodedOutputs.join(' ')}`, expected };
}

function collectPermutations(prefix: readonly string[], rest: readonly string[], out: string[][]): void {
  if (rest.length === 0) {
    out.push([...prefix]);
    return;
  }
  for (let i = 0; i < rest.length; i += 1) {
    collectPermutations([...prefix, rest[i]!], rest.filter((_, idx) => idx !== i), out);
  }
}

const ALL_PERMUTATIONS: string[][] = [];
collectPermutations([], WIRE_BASE, ALL_PERMUTATIONS);

function oracleSolveLine(line: string): number {
  const [left, right] = line.split('|').map((part) => part.trim().split(/\s+/));
  for (const perm of ALL_PERMUTATIONS) {
    if (!left!.every((sig) => CANONICAL_MAP.has(translatePattern(sig, perm)))) continue;
    return right!.reduce((acc, out) => acc * 10 + CANONICAL_MAP.get(translatePattern(out, perm))!, 0);
  }
  throw new Error(`No permutation matched line: ${line}`);
}

describe('2021 Day 8 Part 2 solver', () => {
  it('binds decoded-output-sum policy and highlights every output digit', () => {
    expect(solver.policy).toBe(DECODED_OUTPUT_SUM_POLICY);
    const frames = solver.trace(solver.parse(OFFICIAL_SMALL_EXAMPLE));
    expect(frames).toHaveLength(1);
    for (const digit of frames[0]!.decoded.outputs) {
      expect(solver.policy.highlightsDigit(digit)).toBe(true);
    }
  });

  it('solves the official small and 10-entry examples with exact contributions', () => {
    expect(solver.solve(solver.parse(OFFICIAL_SMALL_EXAMPLE))).toBe(5353);
    const execution = executeSolver(solver, OFFICIAL_TEN_ENTRY_EXAMPLE);
    expect(execution.answer).toBe(61229);
    expect(execution.runtime).toBe('main-thread');
    const frames = solver.trace(solver.parse(OFFICIAL_TEN_ENTRY_EXAMPLE));
    expect(frames.map((f) => f.contribution)).toEqual([
      8394, 9781, 1197, 9361, 4873, 8418, 4548, 1625, 8717, 4315,
    ]);
  });

  it('preserves leading zeros and handles duplicate or shuffled output digits', () => {
    const leadingZeroLines = [
      `${CANONICAL_SIGNALS} | abcefg cf acdeg acdfg`,
      `${CANONICAL_SIGNALS} | abcefg abcefg abcefg acf`,
      `${CANONICAL_SIGNALS} | abcefg abcefg abcefg abcefg`,
    ].join('\n');
    const frames = solver.trace(solver.parse(leadingZeroLines));
    expect(frames.map((f) => [f.decoded.outputValue, f.decoded.formattedOutput])).toEqual([
      [123, '0123'],
      [7, '0007'],
      [0, '0000'],
    ]);
    expect(solver.solve(solver.parse(leadingZeroLines))).toBe(130);

    const repeatedLines = [
      `${CANONICAL_SIGNALS} | gfbad bgdfa fdabg dgbaf`,
      `${CANONICAL_SIGNALS} | gfdcba cbdafg fdcgab bagcfd`,
    ].join('\n');
    expect(solver.solve(solver.parse(repeatedLines))).toBe(15554);
  });

  it('rejects empty, malformed, frequency-breaking, stealth-forged, and invalid outputs', () => {
    expect(() => solver.parse('')).toThrow(RangeError);
    expect(() => solver.parse('bad line')).toThrow(SyntaxError);
    expect(() => solver.trace(solver.parse(OFFICIAL_SMALL_EXAMPLE), { maxSteps: 0 })).toThrow(RangeError);

    const freqBroken = 'abcefg cf acdeg acdfg bcdf abdef abdefg acf abcdefg abcdfg | cf cf cf cf';
    expect(() => solver.solve(solver.parse(freqBroken))).toThrow(SyntaxError);

    const stealthForged = 'abcefg cf abcdeg acdfg bcdf adfg abdefg acf abcdefg abcdfg | cf cf cf cf';
    expect(() => solver.solve(solver.parse(stealthForged))).toThrow(SyntaxError);

    expect(() => solver.solve(solver.parse(`${CANONICAL_SIGNALS} | a cf cf cf`))).toThrow(SyntaxError);
    expect(() => solver.solve(solver.parse(`${CANONICAL_SIGNALS} | abcef cf cf cf`))).toThrow(SyntaxError);
  });

  it('matches an independent 7! permutation oracle across 30 seeded cases and bounds traces', () => {
    const state: PrngState = { seed: 20210802 };
    const lines: string[] = [];
    let expectedBatchSum = 0;
    for (let i = 0; i < 30; i += 1) {
      const { line, expected } = buildSyntheticCase(state);
      expect(oracleSolveLine(line)).toBe(expected);
      expect(solver.solve(solver.parse(line))).toBe(expected);
      lines.push(line);
      expectedBatchSum += expected;
    }
    expect(solver.solve(solver.parse(lines.join('\n')))).toBe(expectedBatchSum);

    const bounded = solver.trace(solver.parse(OFFICIAL_TEN_ENTRY_EXAMPLE), { maxSteps: 4 });
    expect(bounded.length).toBeLessThanOrEqual(4);
    expect(bounded[0]!.entryIndex).toBe(0);
    expect(bounded[bounded.length - 1]!.entryIndex).toBe(9);
    expect(bounded[bounded.length - 1]!.runningTotal).toBe(61229);
  });
});
