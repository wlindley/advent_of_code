import { describe, expect, it } from 'vitest';
import { ClawConfig, ClawSolution, Vector2D } from './types';

describe('Vector2D', () => {
  it('computes 2D cross product and translation immutably', () => {
    const a = new Vector2D(94n, 34n);
    const b = new Vector2D(22n, 67n);
    expect(Object.isFrozen(a)).toBe(true);
    expect(a.cross(b)).toBe(94n * 67n - 34n * 22n);
    expect(b.cross(a)).toBe(-(94n * 67n - 34n * 22n));

    const shifted = a.translate(10_000_000_000_000n);
    expect(shifted.x).toBe(10_000_000_000_094n);
    expect(shifted.y).toBe(10_000_000_000_034n);
    expect(Object.isFrozen(shifted)).toBe(true);
  });
});

describe('ClawConfig', () => {
  it('stores valid prizeOffset and optional maxPresses and freezes', () => {
    const part1 = new ClawConfig(0n, 100n);
    const part2 = new ClawConfig(10_000_000_000_000n, null);
    expect(Object.isFrozen(part1)).toBe(true);
    expect(part1.prizeOffset).toBe(0n);
    expect(part1.maxPresses).toBe(100n);
    expect(part2.prizeOffset).toBe(10_000_000_000_000n);
    expect(part2.maxPresses).toBeNull();
  });

  it('rejects negative prizeOffset or negative maxPresses', () => {
    expect(() => new ClawConfig(-1n, 100n)).toThrow(RangeError);
    expect(() => new ClawConfig(0n, -1n)).toThrow(RangeError);
  });
});

describe('ClawSolution', () => {
  it('computes tokens dynamically as 3*A + B and freezes', () => {
    const sol = new ClawSolution(80n, 40n);
    expect(Object.isFrozen(sol)).toBe(true);
    expect(sol.pressesA).toBe(80n);
    expect(sol.pressesB).toBe(40n);
    expect(sol.tokens).toBe(280n);
  });

  it('allows zero presses and rejects negative presses', () => {
    expect(new ClawSolution(0n, 0n).tokens).toBe(0n);
    expect(() => new ClawSolution(-1n, 0n)).toThrow(RangeError);
    expect(() => new ClawSolution(0n, -1n)).toThrow(RangeError);
  });
});
