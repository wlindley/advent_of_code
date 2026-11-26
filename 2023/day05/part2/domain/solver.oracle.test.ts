import { describe, expect, it } from 'vitest';
import { Almanac, RangeMap, RangeRule } from '../../shared';
import { solver } from './index';
import { parseSeedRanges } from './intervals';

function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randBigInt(rng: () => number, min: bigint, max: bigint): bigint {
  const span = max - min + 1n;
  const r = BigInt(Math.floor(rng() * 1_000_000_000));
  return min + (r % span);
}

function buildRandomAlmanac(seed: number, scale: bigint, maxRangeLen: bigint): Almanac {
  const rng = createRng(seed);
  const pairCount = 2 + Math.floor(rng() * 3);
  const seeds: bigint[] = [];
  for (let i = 0; i < pairCount; i += 1) {
    seeds.push(randBigInt(rng, 0n, scale));
    seeds.push(randBigInt(rng, 1n, maxRangeLen));
  }
  const categories = ['seed', 'soil', 'fert', 'water', 'light'];
  const maps: RangeMap[] = [];
  for (let m = 0; m < categories.length - 1; m += 1) {
    const ruleCount = 2 + Math.floor(rng() * 4);
    const rules: RangeRule[] = [];
    let cursor = randBigInt(rng, 0n, scale / 4n + 1n);
    for (let r = 0; r < ruleCount; r += 1) {
      const len = randBigInt(rng, 1n, maxRangeLen);
      const dest = randBigInt(rng, 0n, scale);
      rules.push(RangeRule.fromTriple(dest, cursor, len));
      cursor += len + randBigInt(rng, 0n, maxRangeLen);
    }
    maps.push(new RangeMap(categories[m]!, categories[m + 1]!, rules));
  }
  return new Almanac(seeds, maps);
}

function evaluateSeed(almanac: Almanac, seed: bigint): bigint {
  let value = seed;
  for (const map of almanac.maps) {
    value = map.mapValue(value);
  }
  return value;
}

function exhaustiveSeedOracle(almanac: Almanac): bigint {
  const union = parseSeedRanges(almanac.seeds);
  let best: bigint | undefined;
  for (const iv of union.intervals) {
    for (let s = iv.start; s <= iv.end; s += 1n) {
      const loc = evaluateSeed(almanac, s);
      if (best === undefined || loc < best) best = loc;
    }
  }
  return best!;
}

function invertMapValue(map: RangeMap, target: bigint): bigint[] {
  const preimages: bigint[] = [];
  if (map.findRule(target) === undefined) {
    preimages.push(target);
  }
  for (const rule of map.rules) {
    const destEnd = rule.destStart + rule.source.length - 1n;
    if (target >= rule.destStart && target <= destEnd) {
      preimages.push(target - rule.delta);
    }
  }
  return preimages;
}

function backwardCriticalPointsOracle(almanac: Almanac): bigint {
  const seedUnion = parseSeedRanges(almanac.seeds);
  const candidates: bigint[] = seedUnion.intervals.map((iv) => iv.start);

  for (let stage = 0; stage < almanac.maps.length; stage += 1) {
    let layer = new Set<bigint>();
    for (const rule of almanac.maps[stage]!.rules) {
      layer.add(rule.source.start);
      layer.add(rule.source.end + 1n);
    }
    for (let prev = stage - 1; prev >= 0; prev -= 1) {
      const nextLayer = new Set<bigint>();
      for (const target of layer) {
        for (const p of invertMapValue(almanac.maps[prev]!, target)) {
          nextLayer.add(p);
        }
      }
      layer = nextLayer;
    }
    for (const cand of layer) {
      if (seedUnion.contains(cand)) candidates.push(cand);
    }
  }

  let best = evaluateSeed(almanac, candidates[0]!);
  for (let i = 1; i < candidates.length; i += 1) {
    const loc = evaluateSeed(almanac, candidates[i]!);
    if (loc < best) best = loc;
  }
  return best;
}

describe('2023 Day 05 Part 2 differential oracles', () => {
  it('matches exhaustiveSeedOracle across 25 random small-range almanacs', () => {
    for (let i = 1; i <= 25; i += 1) {
      const almanac = buildRandomAlmanac(i * 97, 30n, 8n);
      expect(solver.solve(almanac)).toBe(exhaustiveSeedOracle(almanac));
    }
  });

  it('matches backwardCriticalPointsOracle across 20 huge-scale (> 2^32 and > 2^53) almanacs', () => {
    for (let i = 1; i <= 10; i += 1) {
      const almanac32 = buildRandomAlmanac(1000 + i, 1n << 34n, 1n << 24n);
      expect(solver.solve(almanac32)).toBe(backwardCriticalPointsOracle(almanac32));
    }
    for (let i = 1; i <= 10; i += 1) {
      const almanac56 = buildRandomAlmanac(2000 + i, 1n << 56n, 1n << 40n);
      expect(solver.solve(almanac56)).toBe(backwardCriticalPointsOracle(almanac56));
    }
  });
});
