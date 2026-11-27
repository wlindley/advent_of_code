import { describe, expect, it } from 'vitest';
import { parseReactionNetwork } from './models';
import {
  DEFAULT_MAX_TRACE_FRAMES,
  buildDemandTrace,
  buildFuelSearchTrace,
} from './trace';

const SAMPLE_NET = parseReactionNetwork([
  '10 ORE => 10 A',
  '1 ORE => 1 B',
  '7 A, 1 B => 1 C',
  '7 A, 1 C => 1 D',
  '7 A, 1 D => 1 E',
  '7 A, 1 E => 1 FUEL',
].join('\n'));

const LARGE_BUDGET = 1_000_000_000_000n;

describe('day14 shared trace', () => {
  it('builds demand trace frames from initial FUEL need through all reactions', () => {
    const frames = buildDemandTrace(SAMPLE_NET, 1n, undefined);
    expect(DEFAULT_MAX_TRACE_FRAMES).toBe(80);
    expect(frames).toHaveLength(7);
    expect(frames[0]!.kind).toBe('demand');
    expect(frames[0]!.activeChemical).toBeNull();
    expect(frames[0]!.cumulativeOre).toBe(0n);
    expect(frames[0]!.knownNeeds.get('FUEL')).toBe(1n);

    const last = frames[frames.length - 1]!;
    expect(last.stepIndex).toBe(6);
    expect(last.totalSteps).toBe(6);
    expect(last.activeChemical).toBe('B');
    expect(last.cumulativeOre).toBe(31n);
    expect(last.resolvedDemands.get('A')?.leftover).toBe(2n);
  });

  it('bounds demand trace frames via maxSteps and validates inputs', () => {
    const bounded = buildDemandTrace(SAMPLE_NET, 2n, 3);
    expect(bounded).toHaveLength(3);
    expect(bounded[0]!.stepIndex).toBe(0);
    expect(bounded[2]!.stepIndex).toBe(6);
    expect(bounded[2]!.cumulativeOre).toBe(62n);

    expect(() => buildDemandTrace(SAMPLE_NET, 0n, undefined)).toThrow(RangeError);
    expect(() => buildDemandTrace(SAMPLE_NET, 1n, 0)).toThrow(RangeError);
  });

  it('builds bounded fuel search trace frames across bracket and binary phases', () => {
    const full = buildFuelSearchTrace(SAMPLE_NET, LARGE_BUDGET, undefined);
    expect(full.length).toBeGreaterThan(10);
    expect(full[0]!.kind).toBe('search');
    expect(full[0]!.searchStep.phase).toBe('bracket');
    const last = full[full.length - 1]!;
    expect(last.bestFuel).toBe(last.maxFuel);
    expect(last.oreBudget).toBe(LARGE_BUDGET);

    const bounded = buildFuelSearchTrace(SAMPLE_NET, LARGE_BUDGET, 4);
    expect(bounded).toHaveLength(4);
    expect(bounded[0]!.stepIndex).toBe(0);
    expect(bounded[3]!.stepIndex).toBe(full.length - 1);

    const zeroBudget = buildFuelSearchTrace(SAMPLE_NET, 0n, undefined);
    expect(zeroBudget).toHaveLength(1);
    expect(zeroBudget[0]!.bestFuel).toBe(0n);
    expect(zeroBudget[0]!.bestOre).toBe(0n);

    expect(() => buildFuelSearchTrace(SAMPLE_NET, -1n, undefined)).toThrow(RangeError);
    expect(() => buildFuelSearchTrace(SAMPLE_NET, 100n, -1)).toThrow(RangeError);
  });
});
