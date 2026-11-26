import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { Shape, type OpponentCode, type ResponseCode } from '../../shared';
import {
  derivePlayerShape,
  part2RoundResolver,
  RESPONSE_OUTCOMES,
  solvePart2,
  solver,
  tracePart2,
} from './solver';

const EXAMPLE_INPUT = 'A Y\nB X\nC Z';
const OPPONENT_CODES: readonly OpponentCode[] = ['A', 'B', 'C'];
const RESPONSE_CODES: readonly ResponseCode[] = ['X', 'Y', 'Z'];

// Independent explicit 3x3 payoff oracle (row = A/B/C, col = X/Y/Z).
const PAYOFF_MATRIX: readonly (readonly [number, number, number])[] = [
  [3, 4, 8], // A (Rock): X->Scissors(3+0), Y->Rock(1+3), Z->Paper(2+6)
  [1, 5, 9], // B (Paper): X->Rock(1+0), Y->Paper(2+3), Z->Scissors(3+6)
  [2, 6, 7], // C (Scissors): X->Paper(2+0), Y->Scissors(3+3), Z->Rock(1+6)
];

function stepLcg(state: number): number {
  return (Math.imul(1664525, state) + 1013904223) >>> 0;
}

function oracleScore(raw: string): number {
  let total = 0;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [opp, res] = trimmed.split(/\s+/) as [OpponentCode, ResponseCode];
    total += PAYOFF_MATRIX[OPPONENT_CODES.indexOf(opp)]![RESPONSE_CODES.indexOf(res)]!;
  }
  return total;
}

describe('2022 day 02 part 2 solver', () => {
  it('scores all 9 (A|B|C) x (X|Y|Z) rounds and satisfies algebraic inverse', () => {
    expect(Object.isFrozen(RESPONSE_OUTCOMES)).toBe(true);
    expect(Object.isFrozen(part2RoundResolver)).toBe(true);
    expect(Object.isFrozen(solver)).toBe(true);
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        const resCode = RESPONSE_CODES[c]!;
        const parsed = solver.parse(`${OPPONENT_CODES[r]!} ${resCode}`);
        expect(solvePart2(parsed)).toBe(PAYOFF_MATRIX[r]![c]!);
        expect(part2RoundResolver.resolve(parsed[0]!).outcome).toBe(RESPONSE_OUTCOMES[resCode]);
      }
    }
  });

  it('solves the official example to 12 via solver and executeSolver', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solvePart2(parsed)).toBe(12);
    let tick = 100;
    const fakeClock: Clock = { nowMs: () => (tick += 4) };
    expect(executeSolver(solver, EXAMPLE_INPUT, fakeClock)).toEqual({
      answer: 12,
      elapsedMs: 4,
      runtime: 'main-thread',
    });
  });

  it('traces cumulative score progression [4, 5, 12] on the official example', () => {
    const frames = tracePart2(solver.parse(EXAMPLE_INPUT));
    expect(frames.map((f) => f.summary.totalScore)).toEqual([4, 5, 12]);
    expect(frames[2]?.summary.wins).toBe(1);
    expect(frames[2]?.summary.draws).toBe(1);
    expect(frames[2]?.summary.losses).toBe(1);
  });

  it('rejects invalid opponent and outcome values in derivePlayerShape', () => {
    expect(() => derivePlayerShape(-1 as Shape, 0)).toThrow(RangeError);
    expect(() => derivePlayerShape(3 as Shape, 0)).toThrow(RangeError);
    expect(() => derivePlayerShape(Shape.Rock, -1 as never)).toThrow(RangeError);
    expect(() => derivePlayerShape(Shape.Rock, 3 as never)).toThrow(RangeError);
  });

  it('propagates parse, empty-guide, and invalid trace option errors', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('A Y\nB Q')).toThrow(/Line 2:/);
    expect(() => solvePart2([])).toThrow(RangeError);
    expect(() => solver.trace!(solver.parse('A Y'), { maxSteps: 0 })).toThrow(RangeError);
  });

  it('matches explicit 3x3 PAYOFF_MATRIX oracle across a 2,500-round corpus', () => {
    let seed = 20220202;
    const lines: string[] = [];
    for (let i = 0; i < 2500; i += 1) {
      seed = stepLcg(seed);
      const opp = OPPONENT_CODES[Math.floor((seed / 0x100000000) * 3)]!;
      seed = stepLcg(seed);
      const res = RESPONSE_CODES[Math.floor((seed / 0x100000000) * 3)]!;
      lines.push(`${opp} ${res}`);
    }
    const raw = lines.join('\n');
    const parsed = solver.parse(raw);
    const expected = oracleScore(raw);
    expect(solver.solve(parsed)).toBe(expected);
    const frames = solver.trace!(parsed, { maxSteps: 25 });
    expect(frames).toHaveLength(25);
    expect(frames[24]?.summary.totalRounds).toBe(2500);
    expect(frames[24]?.summary.totalScore).toBe(expected);
  });
});
