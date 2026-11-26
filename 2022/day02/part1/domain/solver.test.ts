import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import type { OpponentCode, ResponseCode } from '../../shared';
import { part1RoundResolver, solvePart1, solver, tracePart1 } from './solver';

const EXAMPLE_INPUT = 'A Y\nB X\nC Z';

const OPPONENT_CODES: readonly OpponentCode[] = ['A', 'B', 'C'];
const RESPONSE_CODES: readonly ResponseCode[] = ['X', 'Y', 'Z'];

// Independent explicit 3x3 payoff oracle (row = A/B/C, col = X/Y/Z).
const PAYOFF_MATRIX: readonly (readonly [number, number, number])[] = [
  [4, 8, 3], // A (Rock) vs X(1+3), Y(2+6), Z(3+0)
  [1, 5, 9], // B (Paper) vs X(1+0), Y(2+3), Z(3+6)
  [7, 2, 6], // C (Scissors) vs X(1+6), Y(2+0), Z(3+3)
];

function makeLcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function oracleScore(raw: string): number {
  let total = 0;
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const [opp, res] = trimmed.split(/\s+/) as [OpponentCode, ResponseCode];
    const r = OPPONENT_CODES.indexOf(opp);
    const c = RESPONSE_CODES.indexOf(res);
    total += PAYOFF_MATRIX[r]![c]!;
  }
  return total;
}

describe('2022 day 02 part 1 solver', () => {
  it('scores all 9 (A|B|C) x (X|Y|Z) single-round combinations', () => {
    expect(Object.isFrozen(part1RoundResolver)).toBe(true);
    for (let r = 0; r < 3; r += 1) {
      for (let c = 0; c < 3; c += 1) {
        const line = `${OPPONENT_CODES[r]!} ${RESPONSE_CODES[c]!}`;
        const parsed = solver.parse(line);
        expect(solvePart1(parsed)).toBe(PAYOFF_MATRIX[r]![c]!);
      }
    }
  });

  it('solves the official example to 15 via solver and executeSolver', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    expect(solvePart1(parsed)).toBe(15);

    let tick = 100;
    const fakeClock: Clock = { nowMs: () => (tick += 4) };
    const execution = executeSolver(solver, EXAMPLE_INPUT, fakeClock);
    expect(execution).toEqual({ answer: 15, elapsedMs: 4, runtime: 'main-thread' });
  });

  it('traces cumulative score progression [8, 9, 15] on the official example', () => {
    const parsed = solver.parse(EXAMPLE_INPUT);
    const frames = tracePart1(parsed);
    expect(frames.map((f) => f.summary.totalScore)).toEqual([8, 9, 15]);
    expect(frames[2]?.summary.wins).toBe(1);
    expect(frames[2]?.summary.losses).toBe(1);
    expect(frames[2]?.summary.draws).toBe(1);
  });

  it('propagates parse, empty, and invalid trace option errors', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('A Y\nB Q')).toThrow(/Line 2:/);
    expect(() => solvePart1([])).toThrow(RangeError);
    expect(() => solver.trace!(solver.parse('A Y'), { maxSteps: 0 })).toThrow(RangeError);
  });

  it('matches explicit 3x3 PAYOFF_MATRIX oracle across a 2,500-round corpus', () => {
    const nextRand = makeLcg(20220201);
    const lines: string[] = [];
    for (let i = 0; i < 2500; i += 1) {
      const opp = OPPONENT_CODES[Math.floor(nextRand() * 3)]!;
      const res = RESPONSE_CODES[Math.floor(nextRand() * 3)]!;
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
