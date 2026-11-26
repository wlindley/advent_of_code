import { describe, expect, it } from 'vitest';
import { ClawMachine } from './machine';
import { solveClawMachine } from './solver';
import { ClawConfig, Vector2D } from './types';

const PART1 = new ClawConfig(0n, 100n);
const UNBOUNDED = new ClawConfig(0n, null);

describe('solveClawMachine (collinear)', () => {
  it('returns off-ray when prize is not on the shared button ray', () => {
    const m = new ClawMachine(new Vector2D(2n, 4n), new Vector2D(4n, 8n), new Vector2D(3n, 5n));
    expect(solveClawMachine(m, PART1)).toEqual({ winnable: false, reason: 'off-ray' });
  });

  it('returns non-integer when gcd(ax, bx) does not divide target.x', () => {
    const m = new ClawMachine(new Vector2D(2n, 4n), new Vector2D(4n, 8n), new Vector2D(3n, 6n));
    expect(solveClawMachine(m, PART1)).toEqual({ winnable: false, reason: 'non-integer' });
  });

  it('returns negative-presses when Diophantine line has no non-negative lattice point', () => {
    const m = new ClawMachine(new Vector2D(4n, 4n), new Vector2D(6n, 6n), new Vector2D(2n, 2n));
    expect(solveClawMachine(m, UNBOUNDED)).toEqual({ winnable: false, reason: 'negative-presses' });
  });

  it('handles press-limit feasibility both when caps tighten to empty and when caps stay slack', () => {
    const overCap = new ClawMachine(new Vector2D(1n, 1n), new Vector2D(1n, 1n), new Vector2D(250n, 250n));
    expect(solveClawMachine(overCap, PART1)).toEqual({ winnable: false, reason: 'exceeds-press-limit' });

    const unbounded = solveClawMachine(overCap, UNBOUNDED);
    expect(unbounded.winnable).toBe(true);
    if (unbounded.winnable) {
      expect(unbounded.solution.pressesA).toBe(0n);
      expect(unbounded.solution.pressesB).toBe(250n);
    }

    const slackCap = new ClawMachine(new Vector2D(1n, 1n), new Vector2D(1n, 1n), new Vector2D(50n, 50n));
    const slackRes = solveClawMachine(slackCap, PART1);
    expect(slackRes.winnable).toBe(true);
    if (slackRes.winnable) {
      expect(slackRes.solution.pressesA).toBe(0n);
      expect(slackRes.solution.pressesB).toBe(50n);
    }
  });

  it('minimizes cost across A-cheaper, B-cheaper, exact-tie, and origin collinear cases', () => {
    // 3 * aStep (3) < bStep (10): prefer max A presses => (2, 5) = 11 tokens.
    const aCheaper = new ClawMachine(new Vector2D(10n, 10n), new Vector2D(1n, 1n), new Vector2D(25n, 25n));
    const rA = solveClawMachine(aCheaper, PART1);
    expect(rA.winnable).toBe(true);
    if (rA.winnable) {
      expect(rA.solution.pressesA).toBe(2n);
      expect(rA.solution.pressesB).toBe(5n);
      expect(rA.solution.tokens).toBe(11n);
    }

    // 3 * aStep (3) > bStep (2): prefer max B presses => (0, 25) = 25 tokens.
    const bCheaper = new ClawMachine(new Vector2D(2n, 2n), new Vector2D(1n, 1n), new Vector2D(25n, 25n));
    const rB = solveClawMachine(bCheaper, PART1);
    expect(rB.winnable).toBe(true);
    if (rB.winnable) {
      expect(rB.solution.pressesA).toBe(0n);
      expect(rB.solution.pressesB).toBe(25n);
      expect(rB.solution.tokens).toBe(25n);
    }

    // Exact tie 3 * aStep === bStep: cost is invariant across feasible k.
    const tie = new ClawMachine(new Vector2D(3n, 3n), new Vector2D(1n, 1n), new Vector2D(7n, 7n));
    const rTie = solveClawMachine(tie, PART1);
    expect(rTie.winnable).toBe(true);
    if (rTie.winnable) expect(rTie.solution.tokens).toBe(7n);

    const origin = new ClawMachine(new Vector2D(2n, 4n), new Vector2D(3n, 6n), new Vector2D(0n, 0n));
    const rOrigin = solveClawMachine(origin, PART1);
    expect(rOrigin.winnable).toBe(true);
    if (rOrigin.winnable) expect(rOrigin.solution.tokens).toBe(0n);
  });
});
