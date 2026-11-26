import { describe, expect, it } from 'vitest';
import { ChronospatialProgram, parseChronospatialInput, VmRegisters, type ThreeBitValue } from '../../shared';
import {
  DEFAULT_MAX_SEARCH_CANDIDATES,
  QuineReconstructionStep,
  QuineSearchResult,
  searchLowestQuine,
} from './quineSearch';

const PART2_EXAMPLE = [
  'Register A: 2024',
  'Register B: 0',
  'Register C: 0',
  '',
  'Program: 0,3,5,4,3,0',
].join('\n');

const SYNTHETIC_16_TOKEN_QUINE = [
  'Register A: 0',
  'Register B: 0',
  'Register C: 0',
  '',
  'Program: 2,4,1,0,7,5,1,4,4,5,5,5,0,3,3,0',
].join('\n');

describe('QuineReconstructionStep & QuineSearchResult invariants', () => {
  it('enforces QuineReconstructionStep invariants and freezes fields', () => {
    const digits: ThreeBitValue[] = [1, 3];
    const step = new QuineReconstructionStep(2, 5, 4n, 3, digits);
    digits.push(7);

    expect(step.candidate).toBe((4n << 3n) | 3n);
    expect(step.matchingDigits).toEqual([1, 3]);
    expect(Object.isFrozen(step)).toBe(true);
    expect(Object.isFrozen(step.matchingDigits)).toBe(true);

    expect(() => new QuineReconstructionStep(-1, 0, 1n, 1, [1])).toThrow(RangeError);
    expect(() => new QuineReconstructionStep(1.5, 0, 1n, 1, [1])).toThrow(RangeError);
    expect(() => new QuineReconstructionStep(0, 0, -1n, 1, [1])).toThrow(RangeError);
    expect(() => new QuineReconstructionStep(0, 0, 0n, 0, [0])).toThrow(RangeError);
    expect(() => new QuineReconstructionStep(0, 0, 1n, 2, [1, 3])).toThrow(RangeError);
  });

  it('enforces QuineSearchResult invariants and freezes fields', () => {
    const step = new QuineReconstructionStep(0, 0, 1n, 2, [2]);
    const steps = [step];
    const result = new QuineSearchResult(steps, 8, 0);
    steps.push(step);

    expect(result.registerA).toBe(10n);
    expect(result.steps).toHaveLength(1);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.steps)).toBe(true);

    expect(() => new QuineSearchResult([], 1, 0)).toThrow(RangeError);
    expect(() => new QuineSearchResult([step], 0, 0)).toThrow(RangeError);
    expect(() => new QuineSearchResult([step], 1.5, 0)).toThrow(RangeError);
    expect(() => new QuineSearchResult([step], 1, -1)).toThrow(RangeError);
    expect(() => new QuineSearchResult([step], 1, 0.5)).toThrow(RangeError);
  });
});

describe('searchLowestQuine', () => {
  it('solves the official Part 2 example with exact step trace and backtrack count', () => {
    const program = parseChronospatialInput(PART2_EXAMPLE);
    const result = searchLowestQuine(program);

    expect(result.registerA).toBe(117440n);
    expect(result.backtracks).toBe(14);
    expect(result.steps).toHaveLength(6);
    expect(result.candidatesTested).toBeLessThan(DEFAULT_MAX_SEARCH_CANDIDATES);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.steps)).toBe(true);
    for (const step of result.steps) {
      expect(Object.isFrozen(step)).toBe(true);
      expect(Object.isFrozen(step.matchingDigits)).toBe(true);
    }
  });

  it('solves a synthetic 16-token adv-3-after-out + cdv quine program', () => {
    const program = parseChronospatialInput(SYNTHETIC_16_TOKEN_QUINE);
    const result = searchLowestQuine(program);
    expect(result.steps).toHaveLength(16);
    expect(result.registerA).toBe(174271345718866n);
  });

  it('preserves non-zero initial registers B and C during search', () => {
    const program = new ChronospatialProgram(new VmRegisters(0n, 5n, 1n), [2, 4, 4, 0, 5, 5, 0, 3, 3, 0]);
    const result = searchLowestQuine(program);
    expect(result.steps).toHaveLength(10);
    expect(result.registerA).toBeGreaterThan(0n);
    expect(() => searchLowestQuine(new ChronospatialProgram(new VmRegisters(0n, 5n, 0n), [2, 4, 4, 0, 5, 5, 0, 3, 3, 0]))).toThrow();
  });

  it('throws Error on empty-output or non-matching no-quine programs', () => {
    const emptyOut = new ChronospatialProgram(new VmRegisters(0n, 0n, 0n), [0, 3]);
    expect(() => searchLowestQuine(emptyOut)).toThrow(Error);

    const noQuine = new ChronospatialProgram(new VmRegisters(0n, 0n, 0n), [5, 1, 0, 3, 3, 0]);
    expect(() => searchLowestQuine(noQuine)).toThrow(Error);
  });

  it('propagates RangeError for infinite-loop programs, tight maxCandidates, and invalid maxCandidates', () => {
    const infinite = new ChronospatialProgram(new VmRegisters(0n, 0n, 0n), [3, 0]);
    expect(() => searchLowestQuine(infinite)).toThrow(RangeError);

    const example = parseChronospatialInput(PART2_EXAMPLE);
    expect(() => searchLowestQuine(example, { maxCandidates: 5 })).toThrow(RangeError);
    for (const bad of [0, -3, 2.5, Number.NaN]) {
      expect(() => searchLowestQuine(example, { maxCandidates: bad })).toThrow(RangeError);
    }
  });
});
