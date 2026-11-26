import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { ALL_YES_POLICY, ANY_YES_POLICY, CustomsSolver } from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  'abc',
  '',
  'a',
  'b',
  'c',
  '',
  'ab',
  'ac',
  '',
  'a',
  'a',
  'a',
  'a',
  '',
  'b',
].join('\n');

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function buildSyntheticBatch(seedStart: number, groupCount: number): string {
  let seed = seedStart;
  const groups: string[] = [];
  for (let g = 0; g < groupCount; g += 1) {
    seed = nextSeed(seed);
    const peopleCount = 1 + (seed % 5);
    const lines: string[] = [];
    for (let p = 0; p < peopleCount; p += 1) {
      let line = '';
      for (let q = 0; q < 26; q += 1) {
        seed = nextSeed(seed);
        if ((seed & 3) === 0) line += String.fromCharCode(97 + q);
      }
      if (line.length === 0) {
        seed = nextSeed(seed);
        line = String.fromCharCode(97 + (seed % 26));
      }
      lines.push(line);
    }
    groups.push(lines.join('\n'));
  }
  return groups.join('\n\n');
}

function setOracle(raw: string, mode: 'union' | 'intersection'): number {
  const blocks = raw.trim().split(/\r?\n\r?\n/);
  let total = 0;
  for (const block of blocks) {
    const sets = block.split(/\r?\n/).map((line) => new Set(line.trim().split('')));
    const first = sets[0] as Set<string>;
    if (mode === 'union') {
      const union = new Set<string>();
      for (const s of sets) for (const ch of s) union.add(ch);
      total += union.size;
    } else {
      let common = 0;
      for (const ch of first) {
        if (sets.every((s) => s.has(ch))) common += 1;
      }
      total += common;
    }
  }
  return total;
}

describe('2020 day06 part1 solver', () => {
  it('solves the official 5-group example and executes cleanly via executeSolver', () => {
    const batch = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(batch)).toBe(11);
    expect(executeSolver(solver, OFFICIAL_EXAMPLE).answer).toBe(11);
  });

  it('produces traces with omitted and explicit TraceOptions', () => {
    const batch = solver.parse(OFFICIAL_EXAMPLE);
    const fullTrace = solver.trace!(batch);
    const cappedTrace = solver.trace!(batch, { maxSteps: 3 });

    expect(fullTrace).toHaveLength(5);
    expect(fullTrace[4]?.runningSum).toBe(11);
    expect(cappedTrace).toHaveLength(3);
    expect(cappedTrace[2]?.groupNumber).toBe(5);
    expect(cappedTrace[2]?.runningSum).toBe(11);
  });

  it('propagates parse errors on empty and malformed inputs', () => {
    expect(() => solver.parse('  \n\n  ')).toThrow(RangeError);
    expect(() => solver.parse('abc\n123')).toThrow(SyntaxError);
  });

  it('matches an independent Set union/intersection oracle across 50 seeded PRNG batches', () => {
    const allYesSolver = new CustomsSolver(ALL_YES_POLICY);
    expect(solver.policy).toBe(ANY_YES_POLICY);

    for (let trial = 0; trial < 50; trial += 1) {
      const groupCount = 1 + (trial % 15);
      const raw = buildSyntheticBatch(202006 + trial * 131, groupCount);
      const batch = solver.parse(raw);
      expect(solver.solve(batch)).toBe(setOracle(raw, 'union'));
      expect(allYesSolver.solve(allYesSolver.parse(raw))).toBe(setOracle(raw, 'intersection'));
    }
  });
});
