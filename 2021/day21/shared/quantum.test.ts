import { describe, expect, it } from 'vitest';
import {
  DEFAULT_QUANTUM_TARGET,
  DIRAC_ROLL_DISTRIBUTION,
  solveQuantumGame,
  traceQuantumGame,
} from './quantum';
import { DiracDiceInput, QuantumTraceFrame, advanceSpace } from './types';

function oracleQuantumSymmetry(
  p1Start: number,
  p2Start: number,
  target: number,
): readonly [bigint, bigint] {
  const memo = new Map<string, readonly [bigint, bigint]>();
  const dfs = (posA: number, posB: number, scoreA: number, scoreB: number): readonly [bigint, bigint] => {
    const key = `${posA},${posB},${scoreA},${scoreB}`;
    const cached = memo.get(key);
    if (cached !== undefined) return cached;
    let winsA = 0n;
    let winsB = 0n;
    for (const [roll, mult] of DIRAC_ROLL_DISTRIBUTION) {
      const nextPos = advanceSpace(posA, roll);
      const nextScore = scoreA + nextPos;
      if (nextScore >= target) {
        winsA += mult;
      } else {
        const [subB, subA] = dfs(posB, nextPos, scoreB, nextScore);
        winsA += mult * subA;
        winsB += mult * subB;
      }
    }
    const result: readonly [bigint, bigint] = [winsA, winsB];
    memo.set(key, result);
    return result;
  };
  return dfs(p1Start, p2Start, 0, 0);
}

describe('quantum Dirac Dice', () => {
  it('solves the official (4, 8) example to 444356092776315n with exact P1/P2 totals', () => {
    const input = new DiracDiceInput(4, 8);
    expect(solveQuantumGame(input, DEFAULT_QUANTUM_TARGET)).toBe(444356092776315n);

    const frames = traceQuantumGame(input, DEFAULT_QUANTUM_TARGET);
    expect(frames[0]).toBeInstanceOf(QuantumTraceFrame);
    expect(frames[0]!.round).toBe(0);
    expect(frames[0]!.activePlayer).toBeNull();
    expect(frames[0]!.activeUniverses).toBe(1n);

    const last = frames[frames.length - 1]!;
    expect(last.p1Wins).toBe(444356092776315n);
    expect(last.p2Wins).toBe(341960390180808n);
    expect(last.activeUniverses).toBe(0n);
  });

  it('handles a P2-dominant starting pair (6, 1) where p2Wins > p1Wins', () => {
    const input = new DiracDiceInput(6, 1);
    const [expectedP1, expectedP2] = oracleQuantumSymmetry(6, 1, 21);
    expect(expectedP2 > expectedP1).toBe(true);
    expect(solveQuantumGame(input, 21)).toBe(expectedP2);

    const frames = traceQuantumGame(input, 21);
    const last = frames[frames.length - 1]!;
    expect(last.p1Wins).toBe(expectedP1);
    expect(last.p2Wins).toBe(expectedP2);
  });

  it('satisfies exact 27x universe conservation on every round', () => {
    const frames = traceQuantumGame(new DiracDiceInput(4, 8), 21);
    for (let i = 1; i < frames.length; i += 1) {
      const prev = frames[i - 1]!;
      const cur = frames[i]!;
      expect(prev.activeUniverses * 27n).toBe(
        cur.activeUniverses + (cur.p1Wins - prev.p1Wins) + (cur.p2Wins - prev.p2Wins),
      );
    }
  });

  it('matches independent player-symmetry memoized BigInt DP across seeded pairs and targets', () => {
    const cases: readonly (readonly [number, number, number])[] = [
      [1, 1, 10],
      [10, 5, 12],
      [7, 3, 15],
      [2, 9, 21],
    ];
    for (const [p1, p2, target] of cases) {
      const [w1, w2] = oracleQuantumSymmetry(p1, p2, target);
      const expectedMax = w1 >= w2 ? w1 : w2;
      expect(solveQuantumGame(new DiracDiceInput(p1, p2), target)).toBe(expectedMax);
      const frames = traceQuantumGame(new DiracDiceInput(p1, p2), target);
      const last = frames[frames.length - 1]!;
      expect(last.p1Wins).toBe(w1);
      expect(last.p2Wins).toBe(w2);
    }
  });

  it('handles targetScore = 1 and rejects invalid targetScore or trace options', () => {
    const input = new DiracDiceInput(4, 8);
    expect(solveQuantumGame(input, 1)).toBe(27n);
    const targetOneTrace = traceQuantumGame(input, 1);
    expect(targetOneTrace).toHaveLength(2);
    expect(targetOneTrace[1]!.p1Wins).toBe(27n);
    expect(targetOneTrace[1]!.p2Wins).toBe(0n);
    expect(targetOneTrace[1]!.activeUniverses).toBe(0n);

    expect(() => solveQuantumGame(input, 0)).toThrow(RangeError);
    expect(() => solveQuantumGame(input, -1)).toThrow(RangeError);
    expect(() => solveQuantumGame(input, 2.5)).toThrow(RangeError);
    expect(() => traceQuantumGame(input, 21, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('respects maxSteps sampling caps (1 and 5)', () => {
    const input = new DiracDiceInput(4, 8);
    const one = traceQuantumGame(input, 21, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.p1Wins).toBe(444356092776315n);

    const five = traceQuantumGame(input, 21, { maxSteps: 5 });
    expect(five).toHaveLength(5);
    expect(five[0]!.round).toBe(0);
    expect(five[4]!.p1Wins).toBe(444356092776315n);
  });
});
