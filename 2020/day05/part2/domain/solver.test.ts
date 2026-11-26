import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_INPUT = [
  'FBFBBFFRRL',
  'FBFBBFFLRR',
  'FBFBBFFRRR',
  'FBFBBFFRLL',
].join('\n');

function nextSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function toCode(seatId: number): string {
  let code = '';
  for (let bit = 9; bit >= 0; bit -= 1) {
    const one = ((seatId >> bit) & 1) === 1;
    code += bit >= 3 ? (one ? 'B' : 'F') : (one ? 'R' : 'L');
  }
  return code;
}

function encodeSeats(seatIds: readonly number[]): string {
  const lines: string[] = [];
  for (const id of seatIds) lines.push(toCode(id));
  return lines.join('\n');
}

function parseUniqueSeatIds(raw: string): number[] {
  const unique = new Set<number>();
  for (const line of raw.trim().split(/\r?\n/)) {
    let bits = '';
    for (const ch of line.trim()) bits += ch === 'B' || ch === 'R' ? '1' : '0';
    unique.add(Number.parseInt(bits, 2));
  }
  return [...unique];
}

function compareAsc(a: number, b: number): number {
  return a - b;
}

function sortedGapOracle(raw: string): number {
  const sorted = parseUniqueSeatIds(raw).sort(compareAsc);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i += 1) {
    if ((sorted[i] as number) - (sorted[i - 1] as number) === 2) {
      gaps.push((sorted[i - 1] as number) + 1);
    }
  }
  if (gaps.length !== 1) throw new RangeError(`Expected 1 gap, got ${gaps.length}`);
  return gaps[0] as number;
}

function arithmeticSeriesOracle(raw: string): number {
  const unique = parseUniqueSeatIds(raw);
  let min = 1023;
  let max = 0;
  let sum = 0;
  for (const id of unique) {
    if (id < min) min = id;
    if (id > max) max = id;
    sum += id;
  }
  if (max - min !== unique.length) throw new RangeError('Cabin does not have a single interior gap');
  const expectedSum = ((min + max) * (max - min + 1)) / 2;
  return expectedSum - sum;
}

function buildFuzzCabin(trial: number): string {
  let seed = (20200502 + trial * 7919) >>> 0;
  seed = nextSeed(seed);
  const span = trial === 0 ? 3 : trial === 49 ? 850 : 3 + (seed % 848);
  seed = nextSeed(seed);
  const lo = seed % (1024 - span);
  seed = nextSeed(seed);
  const missing = lo + 1 + (seed % (span - 2));
  const ids: number[] = [];
  for (let id = lo; id < lo + span; id += 1) {
    if (id !== missing) ids.push(id);
  }
  const dupCount = 1 + (seed % Math.min(8, ids.length));
  for (let d = 0; d < dupCount; d += 1) {
    seed = nextSeed(seed);
    ids.push(ids[seed % ids.length] as number);
  }
  for (let i = ids.length - 1; i > 0; i -= 1) {
    seed = nextSeed(seed);
    const j = seed % (i + 1);
    const tmp = ids[i] as number;
    ids[i] = ids[j] as number;
    ids[j] = tmp;
  }
  return encodeSeats(ids);
}

describe('2020 day05 part2 solver', () => {
  it('solves the 4-pass shuffled example via solve, executeSolver, and both oracles', () => {
    const manifest = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(manifest)).toBe(357);
    expect(executeSolver(solver, EXAMPLE_INPUT).answer).toBe(357);
    expect(sortedGapOracle(EXAMPLE_INPUT)).toBe(357);
    expect(arithmeticSeriesOracle(EXAMPLE_INPUT)).toBe(357);
  });

  it('produces traces with omitted and explicit TraceOptions', () => {
    const manifest = solver.parse(EXAMPLE_INPUT);
    const fullTrace = solver.trace!(manifest);
    const cappedTrace = solver.trace!(manifest, { maxSteps: 5 });

    expect(fullTrace).toHaveLength(15);
    expect(fullTrace[14]?.result.seatId).toBe(357);
    expect(fullTrace[14]?.activePass.code).toBe('FBFBBFFRLR');
    expect(fullTrace[14]?.bspStep?.stepIndex).toBe(10);
    expect(cappedTrace).toHaveLength(5);
    expect(cappedTrace[4]?.bspStep?.stepIndex).toBe(10);
  });

  it('handles extreme interior seat gaps and duplicate passes', () => {
    expect(solver.solve(solver.parse(encodeSeats([0, 2])))).toBe(1);
    expect(solver.solve(solver.parse(encodeSeats([1021, 1023])))).toBe(1022);
    expect(solver.solve(solver.parse(encodeSeats([355, 356, 356, 358, 358, 359])))).toBe(357);
  });

  it('rejects empty, malformed, and invalid-gap cabins', () => {
    expect(() => solver.parse('  \n  ')).toThrow(RangeError);
    expect(() => solver.parse('FBFBBFFRLR\nBADCODE')).toThrow(SyntaxError);
    expect(() => solver.solve(solver.parse(encodeSeats([357])))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse(encodeSeats([100, 101, 102, 103, 104, 105])))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse(encodeSeats([100, 101, 103, 104, 106, 107])))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse(encodeSeats([355, 356, 359, 360])))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse(encodeSeats([1, 2, 3])))).toThrow(RangeError);
    expect(() => solver.solve(solver.parse(encodeSeats([1020, 1021, 1022])))).toThrow(RangeError);
  });

  it('matches both independent deduplicating oracles across 50 seeded fuzz cabins', () => {
    for (let trial = 0; trial < 50; trial += 1) {
      const raw = buildFuzzCabin(trial);
      const actual = solver.solve(solver.parse(raw));
      expect(actual).toBe(sortedGapOracle(raw));
      expect(actual).toBe(arithmeticSeriesOracle(raw));
    }
  });
});
