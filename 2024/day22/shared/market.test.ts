import { describe, expect, it } from 'vitest';
import {
  buildBuyerPriceWindow,
  evaluateBuyers,
  findBestBananaSequence,
  sumNthSecrets,
} from './market';
import { encodeDeltaSequence } from './model';
import { advanceSecret, secretPrice } from './prng';

function oracleBestBananaSequence(seeds: readonly number[], steps: number): { maxBananas: number; bestKey: number | null } {
  const totals = new Map<number, number>();
  for (const seed of seeds) {
    const seen = new Set<number>();
    let cur = seed;
    let p0 = secretPrice(cur);
    const deltas: number[] = [];
    for (let t = 1; t <= steps; t += 1) {
      cur = advanceSecret(cur);
      const p1 = secretPrice(cur);
      deltas.push(p1 - p0);
      p0 = p1;
      if (t >= 4) {
        const key = encodeDeltaSequence([deltas[t - 4]!, deltas[t - 3]!, deltas[t - 2]!, deltas[t - 1]!]);
        if (!seen.has(key)) {
          seen.add(key);
          totals.set(key, (totals.get(key) ?? 0) + p1);
        }
      }
    }
  }
  let bestKey: number | null = null;
  let maxBananas = 0;
  for (const [k, v] of totals.entries()) {
    if (bestKey === null || v > maxBananas || (v === maxBananas && k < bestKey)) {
      bestKey = k;
      maxBananas = v;
    }
  }
  return { maxBananas, bestKey };
}

describe('sumNthSecrets and evaluateBuyers', () => {
  it('solves the official Part 1 example and evaluates buyer outcomes', () => {
    const seeds = [1, 10, 100, 2024];
    expect(sumNthSecrets(seeds, 2_000)).toBe(37_327_623n);

    const res = evaluateBuyers(seeds, 2_000);
    expect(res.totalFinalSecret).toBe(37_327_623n);
    expect(res.buyers).toHaveLength(4);
    expect(res.buyers[0]!.finalSecret).toBe(8_685_429);
    expect(res.buyers[3]!.finalPrice).toBe(4);
    expect(evaluateBuyers([], 2_000).totalFinalSecret).toBe(0n);
  });
});

describe('findBestBananaSequence', () => {
  it('solves official Part 2 examples for [123] (9 steps) and [1, 2, 3, 2024] (2000 steps)', () => {
    const small = findBestBananaSequence([123], 9, 3);
    expect(small.maxBananas).toBe(6);
    expect(small.bestCandidate?.deltas).toEqual([-1, -1, 0, 2]);

    const part2 = findBestBananaSequence([1, 2, 3, 2024], 2_000, 5);
    expect(part2.maxBananas).toBe(23);
    expect(part2.bestCandidate?.deltas).toEqual([-2, 1, -1, 3]);
    expect(part2.topCandidates.length).toBeLessThanOrEqual(5);
  });

  it('handles zero-price [0] buyer at 4 steps, < 4 steps, and empty seeds', () => {
    const zeroBuyer = findBestBananaSequence([0], 4, 3);
    expect(zeroBuyer.bestCandidate?.deltas).toEqual([0, 0, 0, 0]);
    expect(zeroBuyer.maxBananas).toBe(0);
    expect(zeroBuyer.bestCandidate?.matchedBuyers).toBe(1);

    const tooShort = findBestBananaSequence([123], 3, 3);
    expect(tooShort.bestCandidate).toBeNull();
    expect(tooShort.maxBananas).toBe(0);

    const empty = findBestBananaSequence([], 2_000, 3);
    expect(empty.buyerCount).toBe(0);
    expect(empty.bestCandidate).toBeNull();
  });

  it('counts only the first occurrence per buyer and matches an independent Map/Set oracle', () => {
    const seq0000 = encodeDeltaSequence([0, 0, 0, 0]);
    const zeroLong = findBestBananaSequence([0], 10, 1);
    expect(zeroLong.bestCandidate?.key).toBe(seq0000);
    expect(zeroLong.maxBananas).toBe(0);

    const sampleSeeds = [1, 2, 3, 7, 123];
    const fast = findBestBananaSequence(sampleSeeds, 60, 4);
    const oracle = oracleBestBananaSequence(sampleSeeds, 60);
    expect(fast.maxBananas).toBe(oracle.maxBananas);
    expect(fast.bestCandidate?.key).toBe(oracle.bestKey);

    const dupOnly = findBestBananaSequence([123], 250, 10);
    const dupOracle = oracleBestBananaSequence([123], 250);
    expect(dupOnly.maxBananas).toBe(dupOracle.maxBananas);
    expect(dupOnly.bestCandidate?.key).toBe(dupOracle.bestKey);
  });
});

describe('buildBuyerPriceWindow', () => {
  it('builds full or sliced windows preserving matched step within bounds', () => {
    const full = buildBuyerPriceWindow(123, 9, encodeDeltaSequence([-1, -1, 0, 2]), 20);
    expect(full.startStep).toBe(0);
    expect(full.endStep).toBe(9);
    expect(full.matchedStep).toBe(6);
    expect(full.matchedPrice).toBe(6);
    expect(full.matchedDeltas).toEqual([-1, -1, 0, 2]);

    const unmatchedTail = buildBuyerPriceWindow(1, 30, null, 10);
    expect(unmatchedTail.startStep).toBe(21);
    expect(unmatchedTail.endStep).toBe(30);
    expect(unmatchedTail.matchedStep).toBeNull();

    const matchedSliced = buildBuyerPriceWindow(2024, 2_000, encodeDeltaSequence([-2, 1, -1, 3]), 12);
    expect(matchedSliced.prices).toHaveLength(12);
    expect(matchedSliced.matchedStep).not.toBeNull();
    expect(matchedSliced.matchedStep!).toBeGreaterThanOrEqual(matchedSliced.startStep + 4);
    expect(matchedSliced.matchedStep!).toBeLessThanOrEqual(matchedSliced.endStep);
    expect(matchedSliced.matchedDeltas).toEqual([-2, 1, -1, 3]);
  });

  it('rejects invalid windowSize or targetKey arguments', () => {
    expect(() => buildBuyerPriceWindow(1, 10, null, 7)).toThrow(RangeError);
    expect(() => buildBuyerPriceWindow(1, 10, -1, 10)).toThrow(RangeError);
    expect(() => buildBuyerPriceWindow(1, 10, 130_321, 10)).toThrow(RangeError);
  });
});
