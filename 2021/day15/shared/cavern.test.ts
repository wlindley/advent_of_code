import { describe, expect, it } from 'vitest';
import {
  CavernMap,
  CavernPolicy,
  PART1_POLICY,
  PART2_POLICY,
  RiskGrid,
  validateRiskCells,
  wrapRisk,
} from './cavern';

describe('wrapRisk', () => {
  it('wraps risk values 1..9 across tile offsets without producing 0', () => {
    expect(wrapRisk(8, 0)).toBe(8);
    expect(wrapRisk(8, 1)).toBe(9);
    expect(wrapRisk(8, 2)).toBe(1);
    expect(wrapRisk(9, 1)).toBe(1);
    expect(wrapRisk(9, 8)).toBe(8);
  });

  it('rejects invalid base risks and negative or non-integer offsets', () => {
    expect(() => wrapRisk(0, 0)).toThrow(RangeError);
    expect(() => wrapRisk(10, 0)).toThrow(RangeError);
    expect(() => wrapRisk(1.5, 0)).toThrow(RangeError);
    expect(() => wrapRisk(5, -1)).toThrow(RangeError);
    expect(() => wrapRisk(5, 0.5)).toThrow(RangeError);
  });
});

describe('CavernPolicy and validateRiskCells', () => {
  it('exposes frozen part policies and validates tileFactor', () => {
    expect(PART1_POLICY.tileFactor).toBe(1);
    expect(PART2_POLICY.tileFactor).toBe(5);
    expect(Object.isFrozen(PART1_POLICY)).toBe(true);
    expect(Object.isFrozen(new CavernPolicy(3))).toBe(true);
    expect(() => new CavernPolicy(0)).toThrow(RangeError);
    expect(() => new CavernPolicy(1.5)).toThrow(RangeError);
  });

  it('validates dimensions, cell length, value bounds, and returns a defensive copy', () => {
    const src = [1, 9, 2, 8];
    const copy = validateRiskCells(2, 2, src);
    expect(Array.from(copy)).toEqual([1, 9, 2, 8]);
    src[0] = 5;
    expect(copy[0]).toBe(1);

    expect(() => validateRiskCells(0, 2, [])).toThrow(RangeError);
    expect(() => validateRiskCells(2, 0, [])).toThrow(RangeError);
    expect(() => validateRiskCells(1.5, 2, [1, 2, 3])).toThrow(RangeError);
    expect(() => validateRiskCells(2, 2.5, [1, 2, 3, 4, 5])).toThrow(RangeError);
    expect(() => validateRiskCells(2, 2, [1, 2, 3])).toThrow(RangeError);
    expect(() => validateRiskCells(2, 2, [1, 0, 3, 4])).toThrow(RangeError);
    expect(() => validateRiskCells(2, 2, [1, 10, 3, 4])).toThrow(RangeError);
    expect(() => validateRiskCells(2, 2, [1, 2.2, 3, 4])).toThrow(RangeError);
  });
});

describe('RiskGrid and CavernMap', () => {
  it('stores immutable grid risks, validates coordinates, and expands uniformly', () => {
    const grid = new RiskGrid(2, 2, [8, 9, 1, 2]);
    expect(Object.isFrozen(grid)).toBe(true);
    expect(grid.cellCount).toBe(4);
    expect(grid.riskAt(0, 0)).toBe(8);
    expect(grid.riskAt(1, 1)).toBe(2);
    expect(() => grid.riskAt(-1, 0)).toThrow(RangeError);
    expect(() => grid.riskAt(2, 0)).toThrow(RangeError);
    expect(() => grid.riskAt(0, -1)).toThrow(RangeError);
    expect(() => grid.riskAt(0, 2)).toThrow(RangeError);
    expect(() => grid.riskAt(0.5, 0)).toThrow(RangeError);
    expect(() => grid.riskAt(0, 0.5)).toThrow(RangeError);

    const map1 = grid.expand(PART1_POLICY);
    expect(map1.rows).toBe(2);
    expect(map1.cols).toBe(2);
    expect(map1.tileFactor).toBe(1);
    expect(map1.startIndex).toBe(0);
    expect(map1.goalIndex).toBe(3);
    expect(map1.indexOf(1, 0)).toBe(2);
    expect(map1.riskLevels[0]).toBe(8);

    const map2 = grid.expand(new CavernPolicy(2));
    expect(Object.isFrozen(map2)).toBe(true);
    expect(map2.rows).toBe(4);
    expect(map2.cols).toBe(4);
    expect(map2.cellCount).toBe(16);
    expect(map2.riskAt(0, 0)).toBe(8);
    expect(map2.riskAt(0, 2)).toBe(9);
    expect(map2.riskAt(2, 0)).toBe(9);
    expect(map2.riskAt(2, 2)).toBe(1);
    expect(map2.riskAt(3, 3)).toBe(4);
  });

  it('validates CavernMap tileFactor directly', () => {
    expect(() => new CavernMap(1, 1, 0, [5])).toThrow(RangeError);
  });
});
