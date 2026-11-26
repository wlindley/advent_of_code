import { describe, expect, it } from 'vitest';
import {
  LINEAR_FUEL_MODEL,
  LinearFuelModel,
  TRIANGULAR_FUEL_MODEL,
  TriangularFuelModel,
  absDiffBigInt,
} from './fuelModel';

describe('absDiffBigInt', () => {
  it('computes non-negative distance regardless of operand order or sign', () => {
    expect(absDiffBigInt(5n, 2n)).toBe(3n);
    expect(absDiffBigInt(2n, 5n)).toBe(3n);
    expect(absDiffBigInt(-10n, 4n)).toBe(14n);
    expect(absDiffBigInt(-3n, -7n)).toBe(4n);
    expect(absDiffBigInt(0n, 0n)).toBe(0n);
  });
});

describe('LinearFuelModel', () => {
  it('exposes metadata, frozen singleton, and linear cost', () => {
    expect(LINEAR_FUEL_MODEL).toBeInstanceOf(LinearFuelModel);
    expect(Object.isFrozen(LINEAR_FUEL_MODEL)).toBe(true);
    expect(LINEAR_FUEL_MODEL.id).toBe('linear');
    expect(LINEAR_FUEL_MODEL.label).toBe('Linear (1 fuel/step)');
    expect(LINEAR_FUEL_MODEL.costForDistance(0n)).toBe(0n);
    expect(LINEAR_FUEL_MODEL.costForDistance(7n)).toBe(7n);
    expect(LINEAR_FUEL_MODEL.costForDistance(10n ** 30n)).toBe(10n ** 30n);
  });

  it('rejects negative distances', () => {
    expect(() => LINEAR_FUEL_MODEL.costForDistance(-1n)).toThrow(RangeError);
  });
});

describe('TriangularFuelModel', () => {
  it('exposes metadata, frozen singleton, and triangular cost', () => {
    expect(TRIANGULAR_FUEL_MODEL).toBeInstanceOf(TriangularFuelModel);
    expect(Object.isFrozen(TRIANGULAR_FUEL_MODEL)).toBe(true);
    expect(TRIANGULAR_FUEL_MODEL.id).toBe('triangular');
    expect(TRIANGULAR_FUEL_MODEL.label).toBe('Triangular (1+2+...+d)');
    expect(TRIANGULAR_FUEL_MODEL.costForDistance(0n)).toBe(0n);
    expect(TRIANGULAR_FUEL_MODEL.costForDistance(1n)).toBe(1n);
    expect(TRIANGULAR_FUEL_MODEL.costForDistance(4n)).toBe(10n);
    expect(TRIANGULAR_FUEL_MODEL.costForDistance(11n)).toBe(66n);
  });

  it('rejects negative distances', () => {
    expect(() => TRIANGULAR_FUEL_MODEL.costForDistance(-1n)).toThrow(RangeError);
  });
});
