import { describe, expect, it } from 'vitest';
import {
  TransitionChoice,
  buildDirectionalCostTable,
  buildNumericSequence,
  numericTransition,
  reconstructLayerSequences,
  solveDoorCode,
  solveDoorCodes,
} from './dp';
import {
  DIRECTIONAL_KEYS,
  DoorCode,
  KeypadConfig,
  PART1_DIRECTIONAL_ROBOTS,
  PART2_DIRECTIONAL_ROBOTS,
} from './model';
import { parseDoorCodes } from './parser';

const OFFICIAL_EXAMPLE = '029A\n980A\n179A\n456A\n379A';

describe('TransitionChoice and DirectionalCostTable', () => {
  it('validates TransitionChoice invariants', () => {
    const tc = new TransitionChoice(4n, 'v<<A');
    expect(Object.isFrozen(tc)).toBe(true);
    expect(tc.cost).toBe(4n);
    expect(tc.bestPath).toBe('v<<A');
    expect(() => new TransitionChoice(0n, 'A')).toThrow(RangeError);
    expect(() => new TransitionChoice(1n, '')).toThrow(RangeError);
  });

  it('builds DP table for D=0..2 and validates depth and key lookups', () => {
    const t0 = buildDirectionalCostTable(0);
    expect(t0.directionalRobots).toBe(0);
    expect(t0.maxCostAt(0)).toBe(1n);
    for (const from of DIRECTIONAL_KEYS) {
      for (const to of DIRECTIONAL_KEYS) {
        expect(t0.costOf(from, to, 0)).toBe(1n);
        expect(t0.bestPathOf(from, to, 0)).toBe(to);
      }
    }

    const t2 = buildDirectionalCostTable(PART1_DIRECTIONAL_ROBOTS);
    expect(t2.sequenceCost('', 0)).toBe(0n);
    expect(t2.maxCostAt(1)).toBe(4n);
    expect(t2.maxCostAt(2)).toBeGreaterThan(4n);

    expect(() => t2.choiceOf('A', 'A', -1)).toThrow(RangeError);
    expect(() => t2.choiceOf('A', 'A', 3)).toThrow(RangeError);
    expect(() => t2.choiceOf('X' as never, 'A', 1)).toThrow(RangeError);
    expect(() => t2.sequenceCost('', 3)).toThrow(RangeError);
    expect(() => t2.maxCostAt(-1)).toThrow(RangeError);
  });
});

describe('AoC 2024 Day 21 DP solver and layer reconstruction', () => {
  it('matches official example lengths and complexities at D=0, D=1, D=2', () => {
    const code029 = new DoorCode('029A');
    expect(solveDoorCode(code029, buildDirectionalCostTable(0)).shortestLength).toBe(12n);
    expect(solveDoorCode(code029, buildDirectionalCostTable(1)).shortestLength).toBe(28n);
    const t2 = buildDirectionalCostTable(2);
    const c029 = solveDoorCode(code029, t2);
    expect(c029.shortestLength).toBe(68n);
    expect(c029.complexity).toBe(1972n);
    expect(solveDoorCode(new DoorCode('379A'), t2).shortestLength).toBe(64n);
    expect(solveDoorCode(new DoorCode('379A'), t2).complexity).toBe(24256n);

    const codes = parseDoorCodes(OFFICIAL_EXAMPLE);
    const result = solveDoorCodes(codes, new KeypadConfig(PART1_DIRECTIONAL_ROBOTS));
    expect(result.entries.map((e) => e.shortestLength)).toEqual([68n, 60n, 68n, 64n, 64n]);
    expect(result.totalComplexity).toBe(126384n);
  });

  it('computes numericTransition and reconstructs layers in descending depth order', () => {
    const t0 = buildDirectionalCostTable(0);
    const code = new DoorCode('029A');
    expect(numericTransition('A', '0', t0).bestPath).toBe('<A');
    expect(buildNumericSequence(code, t0).length).toBe(12);
    const layers0 = reconstructLayerSequences(code, t0, 100);
    expect(layers0).toHaveLength(1);
    expect(layers0![0]!.length).toBe(12);

    const t2 = buildDirectionalCostTable(2);
    const layers2 = reconstructLayerSequences(code, t2, 100);
    expect(Object.isFrozen(layers2)).toBe(true);
    expect(layers2).toHaveLength(3);
    expect(layers2![0]!.length).toBe(12);
    expect(layers2![1]!.length).toBe(28);
    expect(layers2![2]!.length).toBe(68);
    expect(reconstructLayerSequences(code, t2, 67)).toBeNull();
    expect(() => reconstructLayerSequences(code, t2, -1)).toThrow(RangeError);
  });

  it('computes exact BigInt length for D=25 without overflow and rejects reconstruction past cap', () => {
    const codes = parseDoorCodes(OFFICIAL_EXAMPLE);
    const start = performance.now();
    const res = solveDoorCodes(codes, new KeypadConfig(PART2_DIRECTIONAL_ROBOTS));
    const elapsedMs = performance.now() - start;
    expect(elapsedMs).toBeLessThan(100);
    expect(res.totalComplexity).toBeGreaterThan(0n);
    const t25 = buildDirectionalCostTable(PART2_DIRECTIONAL_ROBOTS);
    expect(reconstructLayerSequences(new DoorCode('029A'), t25, 1000)).toBeNull();
  });
});
