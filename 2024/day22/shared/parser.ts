import { assertNonNegativeSafeInt } from './prng';

/** Parses newline-separated initial buyer secret numbers (`0 <= seed <= Number.MAX_SAFE_INTEGER`). */
export function parseBuyerSeeds(raw: string): readonly number[] {
  const seeds: number[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    if (!/^\d+$/.test(trimmed)) {
      throw new RangeError(`Invalid buyer seed: "${trimmed}"`);
    }
    const seed = Number(trimmed);
    assertNonNegativeSafeInt(seed, 'buyer seed');
    seeds.push(seed);
  }
  if (seeds.length === 0) {
    throw new RangeError('Input must contain at least one buyer seed');
  }
  return Object.freeze(seeds);
}
