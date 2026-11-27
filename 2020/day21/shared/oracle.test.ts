import { describe, expect, it } from 'vitest';
import { analyzeAllergens, resolveAllergenMapping } from './analysis';
import { type AllergenDocument, parseAllergenDocument } from './model';
import { DANGEROUS_LIST_POLICY, SAFE_APPEARANCES_POLICY } from './policies';

function createRng(seed: number): () => number {
  let state = (seed + 1) >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function searchMatchings(
  doc: AllergenDocument,
  aId: number,
  usedMask: number,
  current: number[],
  matchings: number[][],
): void {
  if (aId === doc.allergenCount) {
    matchings.push([...current]);
    return;
  }
  for (let iId = 0; iId < doc.ingredientCount; iId += 1) {
    if ((usedMask & (1 << iId)) !== 0) continue;
    const valid = doc.foods.every(
      (f) => !f.allergenIds.includes(aId) || f.ingredientIds.includes(iId),
    );
    if (!valid) continue;
    current[aId] = iId;
    searchMatchings(doc, aId + 1, usedMask | (1 << iId), current, matchings);
  }
}

function enumerateMatchings(doc: AllergenDocument): number[][] {
  const matchings: number[][] = [];
  const current = new Array<number>(doc.allergenCount).fill(-1);
  searchMatchings(doc, 0, 0, current, matchings);
  return matchings;
}

function oracleSafeAppearances(doc: AllergenDocument, matchings: readonly (readonly number[])[]): number {
  const suspect = new Set<number>();
  for (const m of matchings) {
    for (const iId of m) suspect.add(iId);
  }
  let count = 0;
  for (const food of doc.foods) {
    for (const iId of food.ingredientIds) {
      if (!suspect.has(iId)) count += 1;
    }
  }
  return count;
}

function formatFoodLine(ings: readonly string[], algs: readonly string[]): string {
  return algs.length === 0 ? ings.join(' ') : `${ings.join(' ')} (contains ${algs.join(', ')})`;
}

function buildPlantedUnique(seed: number): string {
  const rand = createRng(seed);
  const numA = 1 + (seed % 5);
  const numI = Math.min(8, numA + 1 + (seed % 3));
  const ings = Array.from({ length: numI }, (_, i) => `i${String.fromCharCode(97 + i)}`);
  const algs = Array.from({ length: numA }, (_, a) => `a${String.fromCharCode(97 + a)}`);
  const lines: string[] = [];
  // Triangular planting guarantees unique bijection a_k -> i_k.
  for (let a = 0; a < numA; a += 1) {
    const foodIngs = ings.slice(a, numA).concat(ings.slice(numA).filter(() => rand() < 0.5));
    if (foodIngs.length === 0) foodIngs.push(ings[a]!);
    lines.push(formatFoodLine(foodIngs, [algs[a]!]));
    if (a > 0) lines.push(formatFoodLine([ings[a]!, ings[numI - 1]!], [algs[a]!]));
  }
  lines.push(formatFoodLine(ings.slice(numA), []));
  return lines.join('\n');
}

function buildPlantedMulti(seed: number): string {
  const rand = createRng(seed);
  const numA = 2 + (seed % 4);
  const numI = Math.min(8, Math.max(numA + 1, 3 + (seed % 4)));
  const ings = Array.from({ length: numI }, (_, i) => `i${String.fromCharCode(97 + i)}`);
  const algs = Array.from({ length: numA }, (_, a) => `a${String.fromCharCode(97 + a)}`);
  const lines: string[] = [formatFoodLine([ings[0]!, ings[1]!, ings[numI - 1]!], [algs[0]!, algs[1]!])];
  lines.push(formatFoodLine([ings[0]!, ings[1]!], [algs[0]!]));
  lines.push(formatFoodLine([ings[0]!, ings[1]!], [algs[1]!]));
  for (let a = 2; a < numA; a += 1) {
    const safe = rand() < 0.5 ? [ings[numI - 1]!] : [];
    lines.push(formatFoodLine([ings[a]!, ...safe], [algs[a]!]));
  }
  return lines.join('\n');
}

function buildUnplanted(seed: number): string {
  const rand = createRng(seed);
  const numA = 1 + (seed % 5);
  const numI = Math.min(8, 2 + (seed % 7));
  const ings = Array.from({ length: numI }, (_, i) => `i${String.fromCharCode(97 + i)}`);
  const algs = Array.from({ length: numA }, (_, a) => `a${String.fromCharCode(97 + a)}`);
  const lines: string[] = [];
  for (let f = 0; f < numA + 2; f += 1) {
    const foodIngs = ings.filter(() => rand() < 0.55);
    if (foodIngs.length === 0) foodIngs.push(ings[Math.floor(rand() * numI)]!);
    const foodAlgs = f < numA ? [algs[f]!] : algs.filter(() => rand() < 0.35);
    lines.push(formatFoodLine(foodIngs, foodAlgs));
  }
  return lines.join('\n');
}

describe('2020 Day 21 brute-force backtracking oracle', () => {
  it('matches exhaustive injective backtracking across 60 planted and unplanted instances', () => {
    let zeroCount = 0;
    let uniqueCount = 0;
    let multiCount = 0;

    for (let seed = 0; seed < 60; seed += 1) {
      const raw = seed < 20
        ? buildPlantedUnique(seed)
        : seed < 40
          ? buildPlantedMulti(seed)
          : buildUnplanted(seed);
      const doc = parseAllergenDocument(raw);
      const matchings = enumerateMatchings(doc);

      if (matchings.length >= 1) {
        expect(SAFE_APPEARANCES_POLICY.solve(doc)).toBe(oracleSafeAppearances(doc, matchings));
      }
      if (matchings.length === 1) {
        uniqueCount += 1;
        const expected = matchings[0]!;
        const resolution = resolveAllergenMapping(analyzeAllergens(doc));
        expect(resolution.assignments.map((a) => a.ingredientId)).toEqual(expected);
        expect(DANGEROUS_LIST_POLICY.solve(doc)).toBe(expected.map((id) => doc.ingredients[id]!).join(','));
      } else {
        if (matchings.length === 0) zeroCount += 1;
        else multiCount += 1;
        expect(() => DANGEROUS_LIST_POLICY.solve(doc)).toThrow();
      }
    }

    expect(zeroCount).toBeGreaterThan(0);
    expect(uniqueCount).toBeGreaterThan(0);
    expect(multiCount).toBeGreaterThan(0);
  });
});
