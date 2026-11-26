import { describe, expect, it } from 'vitest';
import { CrabFleet } from './fleet';
import { LINEAR_FUEL_MODEL, TRIANGULAR_FUEL_MODEL } from './fuelModel';

describe('CrabFleet', () => {
  it('stores frozen immutable positions and computes bounds dynamically', () => {
    const source = [16n, 1n, 2n, 0n, 4n, 2n, 7n, 1n, 2n, 14n];
    const fleet = new CrabFleet(source);
    source[0] = 999n;

    expect(Object.isFrozen(fleet)).toBe(true);
    expect(Object.isFrozen(fleet.positions)).toBe(true);
    expect(fleet.size).toBe(10);
    expect(fleet.positions).toEqual([16n, 1n, 2n, 0n, 4n, 2n, 7n, 1n, 2n, 14n]);
    expect(fleet.minPosition).toBe(0n);
    expect(fleet.maxPosition).toBe(16n);
    expect(fleet.span).toBe(16n);
  });

  it('handles single-crab and negative-coordinate fleets', () => {
    const single = new CrabFleet([-5n]);
    expect(single.size).toBe(1);
    expect(single.minPosition).toBe(-5n);
    expect(single.maxPosition).toBe(-5n);
    expect(single.span).toBe(0n);

    const negative = new CrabFleet([-10n, -2n, -7n]);
    expect(negative.minPosition).toBe(-10n);
    expect(negative.maxPosition).toBe(-2n);
    expect(negative.span).toBe(8n);
  });

  it('computes total fuel under linear and triangular cost models', () => {
    const fleet = new CrabFleet([16n, 1n, 2n, 0n, 4n, 2n, 7n, 1n, 2n, 14n]);
    expect(fleet.fuelAt(2n, LINEAR_FUEL_MODEL)).toBe(37n);
    expect(fleet.fuelAt(1n, LINEAR_FUEL_MODEL)).toBe(41n);
    expect(fleet.fuelAt(5n, TRIANGULAR_FUEL_MODEL)).toBe(168n);
    expect(fleet.fuelAt(2n, TRIANGULAR_FUEL_MODEL)).toBe(206n);
  });

  it('rejects empty position lists', () => {
    expect(() => new CrabFleet([])).toThrow(RangeError);
  });
});
