import { describe, expect, it } from 'vitest';
import { ClawMachine } from './machine';
import { solveClawMachine } from './solver';
import { ClawConfig, Vector2D } from './types';

const PART1 = new ClawConfig(0n, 100n);
const PART2 = new ClawConfig(10_000_000_000_000n, null);

describe('solveClawMachine (non-singular)', () => {
  it('solves positive-determinant and negative-determinant winnable machines', () => {
    const posDet = new ClawMachine(new Vector2D(94n, 34n), new Vector2D(22n, 67n), new Vector2D(8400n, 5400n));
    const res1 = solveClawMachine(posDet, PART1);
    expect(res1.winnable).toBe(true);
    if (res1.winnable) {
      expect(res1.solution.pressesA).toBe(80n);
      expect(res1.solution.pressesB).toBe(40n);
      expect(res1.solution.tokens).toBe(280n);
    }

    const negDet = new ClawMachine(new Vector2D(22n, 67n), new Vector2D(94n, 34n), new Vector2D(8400n, 5400n));
    const res2 = solveClawMachine(negDet, PART1);
    expect(res2.winnable).toBe(true);
    if (res2.winnable) {
      expect(res2.solution.pressesA).toBe(40n);
      expect(res2.solution.pressesB).toBe(80n);
      expect(res2.solution.tokens).toBe(200n);
    }
  });

  it('detects non-integer solutions when either numA or numB is not divisible by det', () => {
    const fracA = new ClawMachine(new Vector2D(26n, 66n), new Vector2D(67n, 21n), new Vector2D(12748n, 12176n));
    expect(solveClawMachine(fracA, PART1)).toEqual({ winnable: false, reason: 'non-integer' });

    // A=(1,3), B=(2,2), P=(2,4) => det=-4, numA=-4 (integer A=1), numB=-2 (fractional B=0.5).
    const fracB = new ClawMachine(new Vector2D(1n, 3n), new Vector2D(2n, 2n), new Vector2D(2n, 4n));
    expect(solveClawMachine(fracB, PART1)).toEqual({ winnable: false, reason: 'non-integer' });
  });

  it('detects negative-presses when either A or B solution is negative', () => {
    const negA = new ClawMachine(new Vector2D(1n, 3n), new Vector2D(3n, 1n), new Vector2D(8n, 0n));
    expect(solveClawMachine(negA, PART1)).toEqual({ winnable: false, reason: 'negative-presses' });

    const negB = new ClawMachine(new Vector2D(3n, 1n), new Vector2D(1n, 3n), new Vector2D(8n, 0n));
    expect(solveClawMachine(negB, PART1)).toEqual({ winnable: false, reason: 'negative-presses' });
  });

  it('enforces maxPresses cap on A or B and solves unbounded Part 2 targets', () => {
    const capA = new ClawMachine(new Vector2D(1n, 2n), new Vector2D(2n, 1n), new Vector2D(103n, 203n));
    expect(solveClawMachine(capA, PART1)).toEqual({ winnable: false, reason: 'exceeds-press-limit' });
    const unboundedA = solveClawMachine(capA, new ClawConfig(0n, null));
    expect(unboundedA.winnable).toBe(true);
    if (unboundedA.winnable) {
      expect(unboundedA.solution.pressesA).toBe(101n);
      expect(unboundedA.solution.pressesB).toBe(1n);
    }

    const capB = new ClawMachine(new Vector2D(1n, 2n), new Vector2D(2n, 1n), new Vector2D(203n, 103n));
    expect(solveClawMachine(capB, PART1)).toEqual({ winnable: false, reason: 'exceeds-press-limit' });

    const part2Machine = new ClawMachine(new Vector2D(26n, 66n), new Vector2D(67n, 21n), new Vector2D(12748n, 12176n));
    const resPart2 = solveClawMachine(part2Machine, PART2);
    expect(resPart2.winnable).toBe(true);
  });

  it('returns zero presses when prize is at origin without offset', () => {
    const origin = new ClawMachine(new Vector2D(3n, 5n), new Vector2D(7n, 2n), new Vector2D(0n, 0n));
    const res = solveClawMachine(origin, PART1);
    expect(res.winnable).toBe(true);
    if (res.winnable) expect(res.solution.tokens).toBe(0n);
  });
});
