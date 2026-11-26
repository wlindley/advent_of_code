import { describe, expect, it } from 'vitest';
import { Almanac, parseAlmanac, RangeMap, RangeRule } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  findLowestLocation,
  mapSeedToLocation,
  SeedJourneyFrame,
  StageTransition,
  traceAlmanac,
  traceSeedJourney,
} from './trace';

const MINI_ALMANAC = parseAlmanac(
  [
    'seeds: 79 14 55 13',
    '',
    'seed-to-soil map:',
    '50 98 2',
    '52 50 48',
    '',
    'soil-to-location map:',
    '60 56 37',
    '56 93 4',
  ].join('\n'),
);

describe('StageTransition', () => {
  it('computes output, delta, and isIdentity dynamically for matched and identity transitions', () => {
    const rule = RangeRule.fromTriple(52n, 50n, 48n);
    const matched = new StageTransition(0, 'seed', 'soil', 79n, rule);
    expect(Object.isFrozen(matched)).toBe(true);
    expect(matched.output).toBe(81n);
    expect(matched.delta).toBe(2n);
    expect(matched.isIdentity).toBe(false);

    const identity = new StageTransition(0, 'seed', 'soil', 14n, undefined);
    expect(identity.output).toBe(14n);
    expect(identity.delta).toBe(0n);
    expect(identity.isIdentity).toBe(true);
  });

  it('rejects a matchedRule whose source interval does not contain input', () => {
    const rule = RangeRule.fromTriple(50n, 98n, 2n);
    expect(() => new StageTransition(0, 'seed', 'soil', 97n, rule)).toThrow(RangeError);
  });
});

describe('SeedJourneyFrame', () => {
  it('exposes seed, location, stageValues, matchedRuleCount, and isNewBest dynamically', () => {
    const t0 = new StageTransition(0, 'seed', 'soil', 79n, RangeRule.fromTriple(52n, 50n, 48n));
    const t1 = new StageTransition(1, 'soil', 'location', 81n, undefined);
    const frame = new SeedJourneyFrame(0, 4, [t0, t1], 0, 79n, 81n);

    expect(Object.isFrozen(frame)).toBe(true);
    expect(Object.isFrozen(frame.transitions)).toBe(true);
    expect(frame.seed).toBe(79n);
    expect(frame.location).toBe(81n);
    expect(frame.stageValues).toEqual([79n, 81n, 81n]);
    expect(frame.matchedRuleCount).toBe(1);
    expect(frame.isNewBest).toBe(true);

    const nonBest = new SeedJourneyFrame(1, 4, [t0, t1], 0, 79n, 81n);
    expect(nonBest.isNewBest).toBe(false);
  });

  it('rejects an empty transition list', () => {
    expect(() => new SeedJourneyFrame(0, 1, [], 0, 1n, 1n)).toThrow(RangeError);
  });
});

describe('mapSeedToLocation / traceSeedJourney / findLowestLocation', () => {
  it('maps individual seeds and finds the lowest location including 0n', () => {
    expect(mapSeedToLocation(MINI_ALMANAC, 79n)).toBe(85n); // 79 -> 81 -> 85
    expect(mapSeedToLocation(MINI_ALMANAC, 14n)).toBe(14n);

    const transitions = traceSeedJourney(MINI_ALMANAC, 79n);
    expect(transitions).toHaveLength(2);
    expect(transitions[0]!.output).toBe(81n);
    expect(transitions[1]!.output).toBe(85n);
    expect(findLowestLocation(MINI_ALMANAC)).toBe(13n);

    const zeroMap = new RangeMap('seed', 'location', [RangeRule.fromTriple(0n, 5n, 2n)]);
    const zeroAlmanac = new Almanac([10n, 5n, 6n], [zeroMap]);
    expect(findLowestLocation(zeroAlmanac)).toBe(0n);
  });
});

describe('traceAlmanac', () => {
  it('traces all seeds with default maxSteps and preserves earliest seed on ties', () => {
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(200);
    const tieMap = new RangeMap('seed', 'location', [RangeRule.fromTriple(10n, 20n, 5n)]);
    const tieAlmanac = new Almanac([30n, 10n, 20n, 5n], [tieMap]);
    const frames = traceAlmanac(tieAlmanac);

    expect(frames).toHaveLength(4);
    expect(frames[0]!.bestSeed).toBe(30n);
    expect(frames[1]!.bestSeed).toBe(10n);
    expect(frames[1]!.isNewBest).toBe(true);
    expect(frames[2]!.bestSeed).toBe(10n);
    expect(frames[2]!.bestSeedIndex).toBe(1);
    expect(frames[2]!.isNewBest).toBe(false);
    expect(frames[3]!.bestSeed).toBe(5n);
    expect(frames[3]!.bestLocation).toBe(5n);
  });

  it('tracks global best across unsampled middle seeds and supports maxSteps: 1 and invalid maxSteps', () => {
    const idMap = new RangeMap('seed', 'location', [RangeRule.fromTriple(1000n, 999n, 1n)]);
    const almanac = new Almanac([50n, 40n, 2n, 30n, 20n], [idMap]);

    const sampled = traceAlmanac(almanac, { maxSteps: 3 });
    expect(sampled.map((f) => f.seedIndex)).toEqual([0, 2, 4]);
    // Put winner at unsampled index 1:
    const almanacMidWin = new Almanac([50n, 1n, 40n, 30n, 20n], [idMap]);
    const sampledMid = traceAlmanac(almanacMidWin, { maxSteps: 3 });
    expect(sampledMid.map((f) => f.seedIndex)).toEqual([0, 2, 4]);
    expect(sampledMid[1]!.bestSeedIndex).toBe(1);
    expect(sampledMid[1]!.bestSeed).toBe(1n);
    expect(sampledMid[1]!.bestLocation).toBe(1n);
    expect(sampledMid[2]!.bestLocation).toBe(1n);

    const one = traceAlmanac(almanacMidWin, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.seedIndex).toBe(4);
    expect(one[0]!.bestLocation).toBe(1n);

    expect(() => traceAlmanac(almanac, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceAlmanac(almanac, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
