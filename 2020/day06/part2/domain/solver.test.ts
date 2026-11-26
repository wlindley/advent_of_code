import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { ALL_YES_POLICY, ANY_YES_POLICY, sumGroupConsensus } from '../../shared';
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

const ALL_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function buildPersonLine(seedStart: number): { readonly line: string; readonly seed: number } {
  let seed = seedStart;
  let line = '';
  for (let q = 0; q < 26; q += 1) {
    seed = nextSeed(seed);
    if (((seed >>> 16) % 3) !== 0) line += String.fromCharCode(97 + q);
  }
  if (line.length === 0) {
    seed = nextSeed(seed);
    line = String.fromCharCode(97 + ((seed >>> 16) % 26));
  }
  return { line, seed };
}

function buildSyntheticBatch(seedStart: number, groupCount: number): string {
  let seed = seedStart;
  const groups: string[] = [];
  for (let g = 0; g < groupCount; g += 1) {
    seed = nextSeed(seed);
    const peopleCount = 1 + ((seed >>> 16) % 5);
    const lines: string[] = [];
    for (let p = 0; p < peopleCount; p += 1) {
      const next = buildPersonLine(seed);
      seed = next.seed;
      lines.push(next.line);
    }
    groups.push(lines.join('\n'));
  }
  return groups.join('\n\n');
}

function intersectionOracle(raw: string): number {
  const blocks = raw.trim().split(/\r?\n\r?\n/);
  let total = 0;
  for (const block of blocks) {
    const sets = block.split(/\r?\n/).map((line) => new Set(line.trim().split('')));
    const first = sets[0] as Set<string>;
    for (const ch of first) {
      if (sets.every((s) => s.has(ch))) total += 1;
    }
  }
  return total;
}

describe('2020 day06 part2 solver', () => {
  it('binds ALL_YES_POLICY and freezes the solver instance', () => {
    expect(solver.policy).toBe(ALL_YES_POLICY);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('solves the official 5-group example and single-group abcx/abcy/abcz via executeSolver', () => {
    expect(executeSolver(solver, OFFICIAL_EXAMPLE).answer).toBe(6);
    expect(executeSolver(solver, 'abcx\nabcy\nabcz').answer).toBe(3);
  });

  it('produces traces with omitted, empty, and capped TraceOptions', () => {
    const batch = solver.parse(OFFICIAL_EXAMPLE);
    const fullTrace = solver.trace(batch);
    const emptyOptsTrace = solver.trace(batch, {});
    const cappedTrace = solver.trace(batch, { maxSteps: 3 });

    expect(fullTrace).toHaveLength(5);
    expect(fullTrace[1]?.consensus.policyId).toBe('all-yes');
    expect(fullTrace[1]?.consensus.count).toBe(0);
    expect(fullTrace[1]?.consensus.letters).toBe('');
    expect(fullTrace[1]?.runningSum).toBe(3);
    expect(fullTrace[4]?.groupNumber).toBe(5);
    expect(fullTrace[4]?.runningSum).toBe(6);
    expect(emptyOptsTrace).toHaveLength(5);
    expect(cappedTrace).toHaveLength(3);
    expect(cappedTrace[2]?.groupNumber).toBe(5);
    expect(cappedTrace[2]?.runningSum).toBe(6);
  });

  it('handles disjoint, unanimous, single-person, duplicate-letter, and CRLF batches', () => {
    expect(solver.solve(solver.parse('ab\ncd'))).toBe(0);
    const allDisjoint = solver.trace(solver.parse('a\nb\n\nc\nd'));
    expect(allDisjoint[1]?.runningSum).toBe(0);
    expect(solver.solve(solver.parse(`${ALL_LETTERS}\n${ALL_LETTERS}`))).toBe(26);
    expect(solver.solve(solver.parse('xyz'))).toBe(3);
    expect(solver.solve(solver.parse('aabb\nabbb'))).toBe(2);
    expect(solver.solve(solver.parse('ab\r\nac\r\n\r\n\r\na\r\na'))).toBe(2);
  });

  it('propagates parse and trace errors on invalid inputs', () => {
    expect(() => solver.parse('  \n\n  ')).toThrow(RangeError);
    expect(() => solver.parse('ABC')).toThrow(SyntaxError);
    expect(() => solver.parse('abc\n123')).toThrow(SyntaxError);
    expect(() => solver.parse('ab!')).toThrow(SyntaxError);
    expect(() => solver.trace(solver.parse('abc'), { maxSteps: 0 })).toThrow(RangeError);
  });

  it('matches an independent Set intersection oracle across 50 seeded PRNG trials', () => {
    let totalP1 = 0;
    let totalP2 = 0;
    let hasMultiPersonIntersection = false;

    for (let trial = 0; trial < 50; trial += 1) {
      const raw = buildSyntheticBatch(20200602 + trial * 131, 1 + (trial % 15));
      const batch = solver.parse(raw);
      const p2 = solver.solve(batch);
      const p1 = sumGroupConsensus(batch, ANY_YES_POLICY);
      expect(p2).toBe(intersectionOracle(raw));
      expect(p2).toBeLessThanOrEqual(p1);
      totalP1 += p1;
      totalP2 += p2;
      if (batch.groups.some((g) => g.size >= 2 && g.allYesMask > 0)) {
        hasMultiPersonIntersection = true;
      }
    }

    expect(totalP2).toBeGreaterThan(0);
    expect(totalP2).toBeLessThan(totalP1);
    expect(hasMultiPersonIntersection).toBe(true);
  });
});
