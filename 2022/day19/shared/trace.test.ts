import { describe, expect, it } from 'vitest';
import { parseBlueprints } from './parser';
import { buildFactoryTrace, DEFAULT_TRACE_MAX_STEPS } from './trace';

const TWO_BLUEPRINTS = `
Blueprint 1: Each ore robot costs 4 ore. Each clay robot costs 2 ore. Each obsidian robot costs 3 ore and 14 clay. Each geode robot costs 2 ore and 7 obsidian.
Blueprint 2: Each ore robot costs 2 ore. Each clay robot costs 3 ore. Each obsidian robot costs 3 ore and 8 clay. Each geode robot costs 3 ore and 12 obsidian.
`;

describe('buildFactoryTrace', () => {
  it('builds full per-minute frames across blueprints when total <= maxSteps', () => {
    const bps = parseBlueprints(TWO_BLUEPRINTS);
    const frames = buildFactoryTrace(bps, 24, 'quality-sum');
    expect(DEFAULT_TRACE_MAX_STEPS).toBe(64);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(50);
    expect(frames[0]!.activeBlueprintIndex).toBe(0);
    expect(frames[0]!.activeSnapshot.minute).toBe(0);
    expect(frames[0]!.runningAggregate).toBe(0);
    expect(frames[24]!.activeBlueprintIndex).toBe(0);
    expect(frames[24]!.activeSnapshot.minute).toBe(24);
    expect(frames[24]!.runningAggregate).toBe(9);
    const last = frames[frames.length - 1]!;
    expect(last.activeBlueprintIndex).toBe(1);
    expect(last.activeSnapshot.minute).toBe(24);
    expect(last.runningAggregate).toBe(33);
    expect(last.finalAggregate).toBe(33);
  });

  it('samples frames uniformly when total exceeds maxSteps', () => {
    const bps = parseBlueprints(TWO_BLUEPRINTS);
    const frames = buildFactoryTrace(bps, 24, 'quality-sum', { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[0]!.activeSnapshot.minute).toBe(0);
    expect(frames[9]!.activeBlueprintIndex).toBe(1);
    expect(frames[9]!.activeSnapshot.minute).toBe(24);
    expect(frames[9]!.finalAggregate).toBe(33);
  });

  it('slices to first 3 blueprints and computes geode product in geode-product mode', () => {
    const fourText = [1, 2, 3, 4]
      .map(
        (id) =>
          `Blueprint ${id}: Each ore robot costs 4 ore. Each clay robot costs 2 ore. Each obsidian robot costs 3 ore and 14 clay. Each geode robot costs 2 ore and 7 obsidian.`,
      )
      .join('\n');
    const bps = parseBlueprints(fourText);
    const frames = buildFactoryTrace(bps, 24, 'geode-product', { maxSteps: 1 });
    expect(frames).toHaveLength(1);
    expect(frames[0]!.results).toHaveLength(3);
    expect(frames[0]!.finalAggregate).toBe(9 * 9 * 9);
    expect(frames[0]!.runningAggregate).toBe(9 * 9 * 9);
  });

  it('rejects empty blueprint list and invalid maxSteps', () => {
    const bps = parseBlueprints(TWO_BLUEPRINTS);
    expect(() => buildFactoryTrace([], 24, 'quality-sum')).toThrow(RangeError);
    expect(() => buildFactoryTrace(bps, 24, 'quality-sum', { maxSteps: 0 })).toThrow(RangeError);
  });
});
