import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  'FBFBBFFRLR',
  'BFFFBBFRRR',
  'FFFBBBFRRR',
  'BBFFBBFRLL',
].join('\n');

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function buildSyntheticManifest(seedStart: number, count: number): string {
  let seed = seedStart;
  const lines: string[] = [];
  for (let i = 0; i < count; i += 1) {
    let code = '';
    for (let bit = 0; bit < 10; bit += 1) {
      seed = nextSeed(seed);
      const isOne = (seed & 1) === 1;
      code += bit < 7 ? (isOne ? 'B' : 'F') : (isOne ? 'R' : 'L');
    }
    lines.push(code);
  }
  return lines.join('\n');
}

function binaryParseIntOracle(raw: string): number {
  const ids = raw
    .trim()
    .split(/\r?\n/)
    .map((line) => line.replace(/[FL]/g, '0').replace(/[BR]/g, '1'))
    .map((bits) => Number.parseInt(bits, 2));
  return Math.max(...ids);
}

describe('2020 day05 part1 solver', () => {
  it('solves the official 4-pass example and executes cleanly via executeSolver', () => {
    const manifest = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(manifest)).toBe(820);
    expect(executeSolver(solver, OFFICIAL_EXAMPLE).answer).toBe(820);
  });

  it('produces traces with omitted and explicit TraceOptions', () => {
    const manifest = solver.parse(OFFICIAL_EXAMPLE);
    const fullTrace = solver.trace!(manifest);
    const cappedTrace = solver.trace!(manifest, { maxSteps: 5 });

    expect(fullTrace).toHaveLength(15);
    expect(fullTrace[14]?.result.seatId).toBe(820);
    expect(cappedTrace).toHaveLength(5);
    expect(cappedTrace[4]?.bspStep?.stepIndex).toBe(10);
  });

  it('propagates parse errors on empty and malformed inputs', () => {
    expect(() => solver.parse('  \n  ')).toThrow(RangeError);
    expect(() => solver.parse('FBFBBFFRLR\nINVALID')).toThrow(SyntaxError);
  });

  it('matches an independent parseInt binary oracle across 50 seeded PRNG manifests', () => {
    for (let trial = 0; trial < 50; trial += 1) {
      const count = 1 + (trial % 25);
      const raw = buildSyntheticManifest(202005 + trial * 97, count);
      const actual = solver.solve(solver.parse(raw));
      expect(actual).toBe(binaryParseIntOracle(raw));
    }
  });
});
