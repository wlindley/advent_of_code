import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import {
  DIRAC_ROLL_DISTRIBUTION,
  DiracDiceInput,
  QuantumTraceFrame,
  advanceSpace,
} from '../../shared';
import { solver } from './index';

const OFFICIAL_EXAMPLE = [
  'Player 1 starting position: 4',
  'Player 2 starting position: 8',
].join('\n');

type WinPair = readonly [bigint, bigint];

function formatInput(p1: number, p2: number): string {
  return `Player 1 starting position: ${p1}\nPlayer 2 starting position: ${p2}`;
}

function dpSymmetryStep(
  posA: number,
  posB: number,
  scoreA: number,
  scoreB: number,
  target: number,
  memo: (WinPair | undefined)[],
): WinPair {
  const idx = ((posA - 1) * 10 + (posB - 1)) * target * target + scoreA * target + scoreB;
  const cached = memo[idx];
  if (cached !== undefined) return cached;
  let winsA = 0n;
  let winsB = 0n;
  for (const [roll, mult] of DIRAC_ROLL_DISTRIBUTION) {
    const nextPos = advanceSpace(posA, roll);
    const nextScore = scoreA + nextPos;
    if (nextScore >= target) {
      winsA += mult;
    } else {
      const [subB, subA] = dpSymmetryStep(posB, nextPos, scoreB, nextScore, target, memo);
      winsA += mult * subA;
      winsB += mult * subB;
    }
  }
  const result: WinPair = [winsA, winsB];
  memo[idx] = result;
  return result;
}

function oracleQuantumSymmetry(
  p1: number,
  p2: number,
  target: number,
  memo: (WinPair | undefined)[],
): WinPair {
  return dpSymmetryStep(p1, p2, 0, 0, target, memo);
}

describe('2021 Day 21 Part 2 solver', () => {
  it('solves the official (4, 8) example to 444356092776315n', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(parsed).toBeInstanceOf(DiracDiceInput);
    expect(solver.solve(parsed)).toBe(444356092776315n);

    const exec = executeSolver(solver, OFFICIAL_EXAMPLE);
    expect(exec.answer).toBe(444356092776315n);
  });

  it('traces initial and terminal quantum lifecycle totals with omitted options', () => {
    const frames = solver.trace!(solver.parse(OFFICIAL_EXAMPLE));
    const first = frames[0]!;
    const last = frames[frames.length - 1]!;

    expect(first).toBeInstanceOf(QuantumTraceFrame);
    expect(first.round).toBe(0);
    expect(first.activePlayer).toBeNull();
    expect(first.activeUniverses).toBe(1n);
    expect(first.p1Wins).toBe(0n);
    expect(first.p2Wins).toBe(0n);

    expect(last.p1Wins).toBe(444356092776315n);
    expect(last.p2Wins).toBe(341960390180808n);
    expect(last.activeUniverses).toBe(0n);
  });

  it('preserves the 27x round-by-round universe conservation invariant', () => {
    const frames = solver.trace!(solver.parse(OFFICIAL_EXAMPLE));
    for (let i = 1; i < frames.length; i += 1) {
      const prev = frames[i - 1]!;
      const cur = frames[i]!;
      expect(prev.activeUniverses * 27n).toBe(
        cur.activeUniverses + (cur.p1Wins - prev.p1Wins) + (cur.p2Wins - prev.p2Wins),
      );
    }
  });

  it('respects explicit maxSteps bounds of 1 and 5', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    const one = solver.trace!(parsed, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.p1Wins).toBe(444356092776315n);

    const five = solver.trace!(parsed, { maxSteps: 5 });
    expect(five).toHaveLength(5);
    expect(five[0]!.round).toBe(0);
    expect(five[4]!.p1Wins).toBe(444356092776315n);
    expect(five[4]!.activeUniverses).toBe(0n);
  });

  it('handles P2-dominant pair (6, 1) where p2Wins exceeds p1Wins', () => {
    const parsed = solver.parse(formatInput(6, 1));
    const frames = solver.trace!(parsed);
    const last = frames[frames.length - 1]!;
    expect(last.p2Wins > last.p1Wins).toBe(true);
    expect(solver.solve(parsed)).toBe(last.p2Wins);
  });

  it('matches an independent player-symmetry DP oracle across seeded pairs', () => {
    const pairs: readonly (readonly [number, number])[] = [
      [1, 1],
      [1, 10],
      [2, 9],
      [3, 7],
      [5, 8],
      [6, 1],
      [8, 4],
      [10, 5],
    ];
    const memo = new Array<WinPair | undefined>(100 * 21 * 21);
    for (const [p1, p2] of pairs) {
      const [w1, w2] = oracleQuantumSymmetry(p1, p2, 21, memo);
      const parsed = solver.parse(formatInput(p1, p2));
      expect(solver.solve(parsed)).toBe(w1 >= w2 ? w1 : w2);
      const frames = solver.trace!(parsed);
      const last = frames[frames.length - 1]!;
      expect(last.p1Wins).toBe(w1);
      expect(last.p2Wins).toBe(w2);
    }
  });

  it('rejects missing lines, out-of-range starting spaces, and invalid maxSteps', () => {
    expect(() => solver.parse('Player 1 starting position: 4')).toThrow();
    expect(() => solver.parse(formatInput(0, 8))).toThrow(RangeError);
    expect(() => solver.parse(formatInput(4, 11))).toThrow(RangeError);
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(() => solver.trace!(parsed, { maxSteps: 0 })).toThrow(RangeError);
  });
});
