import { describe, expect, it } from 'vitest';
import { ENCRYPTION_WEAKNESS_POLICY, XmasAttackSolver, type XmasStream, type XmasTraceFrame } from '../../shared';
import { DEFAULT_PREAMBLE_LENGTH, solver } from './index';

const MANIFEST_EXAMPLE = [...Array.from({ length: 25 }, (_, i) => String(i + 1)), '45', '26', '64', '66', '125', '111'].join('\n');
const OFFICIAL_EXAMPLE = [35, 20, 15, 25, 47, 40, 62, 55, 65, 95, 102, 117, 150, 182, 127, 219, 299, 277, 309, 576].join('\n');
const UNDERSIZED_EXAMPLE = Array.from({ length: 25 }, (_, i) => String(i + 1)).join('\n');

function makePrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

function findInvalidOracle(values: readonly bigint[], w: number): bigint | null {
  for (let t = w; t < values.length; t += 1) {
    let valid = false;
    for (let i = t - w; i < t && !valid; i += 1) {
      for (let j = i + 1; j < t; j += 1) {
        if (values[i] !== values[j] && values[i]! + values[j]! === values[t]!) {
          valid = true;
          break;
        }
      }
    }
    if (!valid) return values[t]!;
  }
  return null;
}

function findWeaknessOracle(values: readonly bigint[], target: bigint): bigint | null {
  const prefix: bigint[] = [0n];
  for (let i = 0; i < values.length; i += 1) {
    prefix.push(prefix[i]! + values[i]!);
  }
  for (let start = 0; start < values.length; start += 1) {
    for (let end = start + 1; end < values.length; end += 1) {
      if (prefix[end + 1]! - prefix[start]! === target) {
        let min = values[start]!;
        let max = min;
        for (let k = start + 1; k <= end; k += 1) {
          if (values[k]! < min) min = values[k]!;
          if (values[k]! > max) max = values[k]!;
        }
        return min + max;
      }
    }
  }
  return null;
}

function solveOracle(values: readonly bigint[], w: number): bigint | null {
  const invalid = findInvalidOracle(values, w);
  return invalid === null ? null : findWeaknessOracle(values, invalid);
}

function nextInt(nextRand: () => number, min: number, span: number): number {
  return min + ((nextRand() >>> 16) % span);
}

function generateCase(nextRand: () => number): { readonly w: number; readonly values: readonly bigint[] } {
  const w = nextInt(nextRand, 3, 3);
  const len = w + nextInt(nextRand, 14, 14);
  const values: bigint[] = [];
  for (let i = 0; i < len; i += 1) {
    const val = i >= w && nextInt(nextRand, 0, 4) === 0 ? nextInt(nextRand, 9, 10) : nextInt(nextRand, 1, 5);
    values.push(BigInt(val));
  }
  return { w, values };
}

function solveCustom(w: number, values: readonly bigint[]): bigint {
  const custom = new XmasAttackSolver(ENCRYPTION_WEAKNESS_POLICY, w);
  return custom.solve(custom.parse(values.join('\n')));
}

function assertInvalidFrame(frame: XmasTraceFrame): void {
  expect(frame.phase).toBe('preamble');
  if (frame.phase === 'preamble') expect(frame.isInvalid).toBe(true);
}

function hasEmptyProbe(frames: readonly XmasTraceFrame[]): boolean {
  return frames.some((f) => f.phase === 'weakness' && f.probe.isEmpty);
}

function assertSolvedFrame(frame: XmasTraceFrame, stream: XmasStream, expected: bigint): void {
  expect(frame.phase).toBe('weakness');
  if (frame.phase === 'weakness') {
    expect(frame.isFound).toBe(true);
    expect(frame.weakness?.encryptionWeakness(stream)).toBe(expected);
  }
}

describe('2020 Day 9 Part 2 domain solver', () => {
  it('solves the W=25 manifest example and official W=5 example', () => {
    expect(DEFAULT_PREAMBLE_LENGTH).toBe(25);
    expect(solver.solve(solver.parse(MANIFEST_EXAMPLE))).toBe(25n);

    const w5 = new XmasAttackSolver(ENCRYPTION_WEAKNESS_POLICY, 5);
    expect(w5.solve(w5.parse(OFFICIAL_EXAMPLE))).toBe(62n);
  });

  it('produces two-phase traces and preserves milestones under maxSteps budgets', () => {
    const stream = solver.parse(MANIFEST_EXAMPLE);
    const full = solver.trace(stream);
    expect(full).toHaveLength(22);
    assertInvalidFrame(full[4]!);
    assertSolvedFrame(full[21]!, stream, 25n);

    const one = solver.trace(stream, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    assertSolvedFrame(one[0]!, stream, 25n);

    const two = solver.trace(stream, { maxSteps: 2 });
    expect(two).toHaveLength(2);
    assertInvalidFrame(two[0]!);
    assertSolvedFrame(two[1]!, stream, 25n);

    const twenty = solver.trace(stream, { maxSteps: 20 });
    expect(twenty).toHaveLength(20);
    assertInvalidFrame(twenty[4]!);
    assertSolvedFrame(twenty[19]!, stream, 25n);
  });

  it('handles skipped single-element match, window-emptying element, equal pair, post-invalid range, and > 2^63 BigInts', () => {
    expect(solveCustom(2, [1n, 2n, 10n, 2n, 3n, 5n])).toBe(7n);

    const emptySolver = new XmasAttackSolver(ENCRYPTION_WEAKNESS_POLICY, 2);
    const emptyStream = emptySolver.parse('1\n2\n6\n20\n1\n2\n3');
    expect(emptySolver.solve(emptyStream)).toBe(4n);
    expect(hasEmptyProbe(emptySolver.trace(emptyStream))).toBe(true);

    expect(solveCustom(2, [5n, 5n, 10n])).toBe(10n);
    expect(solveCustom(2, [1n, 2n, 10n, 1n, 4n, 5n])).toBe(6n);

    const a = (1n << 64n) + 1n;
    const m = (1n << 64n) + 4n;
    const b = (1n << 64n) + 2n;
    expect(solveCustom(3, [a, m, b, a + m + b])).toBe(a + m);
  });

  it('throws on undersized, all-valid, missing-range streams, and maxSteps=0', () => {
    const undersized = solver.parse(UNDERSIZED_EXAMPLE);
    expect(() => solver.solve(undersized)).toThrow(RangeError);
    expect(() => solver.trace(solver.parse(MANIFEST_EXAMPLE), { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solveCustom(2, [1n, 2n, 3n])).toThrow('No invalid number found');
    expect(() => solveCustom(2, [1n, 2n, 10n, 4n])).toThrow('No contiguous range');
  });

  it('agrees with an independent O(N*W^2)+O(N^2) differential oracle across 35 seeded cases', () => {
    const nextRand = makePrng(20200922);
    let solvedCount = 0;
    for (let c = 0; c < 35; c += 1) {
      const { w, values } = generateCase(nextRand);
      const expected = solveOracle(values, w);
      if (expected === null) {
        expect(() => solveCustom(w, values)).toThrow();
      } else {
        solvedCount += 1;
        expect(solveCustom(w, values)).toBe(expected);
      }
    }
    expect(solvedCount).toBeGreaterThanOrEqual(15);
  });
});
