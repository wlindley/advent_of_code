import { bigintLog2 } from '../../../shared/core';
import type { AllergenDocument } from './model';

export interface AllergenAssignment {
  readonly allergenId: number;
  readonly allergen: string;
  readonly ingredientId: number;
  readonly ingredient: string;
}

function collectIdsFromMask(mask: bigint, limit: number): readonly number[] {
  const ids: number[] = [];
  for (let i = 0; i < limit; i += 1) {
    if ((mask & (1n << BigInt(i))) !== 0n) ids.push(i);
  }
  return Object.freeze(ids);
}

/** Immutable allergen-to-ingredient candidate intersection analysis. */
export class AllergenAnalysis {
  readonly doc: AllergenDocument;
  readonly candidateMasks: readonly bigint[];

  constructor(doc: AllergenDocument, candidateMasks: readonly bigint[]) {
    this.doc = doc;
    this.candidateMasks = Object.freeze([...candidateMasks]);
    Object.freeze(this);
  }

  get suspectMask(): bigint {
    let mask = 0n;
    for (const m of this.candidateMasks) mask |= m;
    return mask;
  }

  get safeMask(): bigint {
    return this.doc.allIngredientsMask & ~this.suspectMask;
  }

  get suspectIds(): readonly number[] {
    return collectIdsFromMask(this.suspectMask, this.doc.ingredientCount);
  }

  get safeIds(): readonly number[] {
    return collectIdsFromMask(this.safeMask, this.doc.ingredientCount);
  }

  get safeAppearances(): number {
    const freqs = this.doc.ingredientFrequencies;
    let total = 0;
    for (const id of this.safeIds) total += freqs[id]!;
    return total;
  }
}

/** Intersects food ingredient masks per allergen to identify suspect and guaranteed-safe ingredients. */
export function analyzeAllergens(doc: AllergenDocument): AllergenAnalysis {
  const masks = new Array<bigint>(doc.allergenCount).fill(doc.allIngredientsMask);
  for (const food of doc.foods) {
    const foodMask = food.ingredientMask;
    for (const aId of food.allergenIds) {
      masks[aId] = masks[aId]! & foodMask;
    }
  }
  for (let aId = 0; aId < doc.allergenCount; aId += 1) {
    if (masks[aId] === 0n) {
      throw new Error(`Allergen "${doc.allergens[aId]}" has no candidate ingredients`);
    }
  }
  return new AllergenAnalysis(doc, masks);
}

/** Immutable snapshot of a single degree-1 allergen peeling round. */
export class PeelingRound {
  readonly round: number;
  readonly locked: readonly AllergenAssignment[];
  readonly remainingMasks: readonly bigint[];

  constructor(round: number, locked: readonly AllergenAssignment[], remainingMasks: readonly bigint[]) {
    this.round = round;
    this.locked = Object.freeze(locked.map((entry) => Object.freeze({ ...entry })));
    this.remainingMasks = Object.freeze([...remainingMasks]);
    Object.freeze(this);
  }
}

/** Immutable result of one-sided allergen singleton peeling. */
export class AllergenResolution {
  readonly analysis: AllergenAnalysis;
  readonly rounds: readonly PeelingRound[];

  constructor(analysis: AllergenAnalysis, rounds: readonly PeelingRound[]) {
    this.analysis = analysis;
    this.rounds = Object.freeze([...rounds]);
    Object.freeze(this);
  }

  get doc(): AllergenDocument {
    return this.analysis.doc;
  }

  get assignments(): readonly AllergenAssignment[] {
    const all: AllergenAssignment[] = [];
    for (const step of this.rounds) all.push(...step.locked);
    all.sort((a, b) => a.allergenId - b.allergenId);
    return Object.freeze(all);
  }

  get canonicalDangerousList(): string {
    return this.assignments.map((entry) => entry.ingredient).join(',');
  }
}

function runPeelingRound(
  doc: AllergenDocument,
  masks: readonly bigint[],
  lockedFlag: Uint8Array,
  lockedMask: bigint,
  roundNum: number,
): { readonly locked: readonly AllergenAssignment[]; readonly roundMask: bigint } {
  let roundMask = 0n;
  const locked: AllergenAssignment[] = [];
  for (let a = 0; a < doc.allergenCount; a += 1) {
    if (lockedFlag[a]) continue;
    const avail = masks[a]! & ~lockedMask;
    if (avail === 0n) {
      throw new Error(`Allergen "${doc.allergens[a]}" has no remaining candidate ingredients`);
    }
    if ((avail & (avail - 1n)) === 0n) {
      if ((roundMask & avail) !== 0n) {
        throw new Error(`Ingredient collision during peeling round ${roundNum}`);
      }
      roundMask |= avail;
      const ingredientId = bigintLog2(avail);
      lockedFlag[a] = 1;
      locked.push(Object.freeze({
        allergenId: a,
        allergen: doc.allergens[a]!,
        ingredientId,
        ingredient: doc.ingredients[ingredientId]!,
      }));
    }
  }
  if (locked.length === 0) {
    throw new Error('Ambiguous allergen mapping: no singleton candidates remain');
  }
  return { locked, roundMask };
}

/** Resolves a unique allergen-to-ingredient bijection via singleton peeling. */
export function resolveAllergenMapping(analysis: AllergenAnalysis): AllergenResolution {
  const doc = analysis.doc;
  const n = doc.allergenCount;
  if (n === 0) return new AllergenResolution(analysis, []);
  const masks = [...analysis.candidateMasks];
  const lockedFlag = new Uint8Array(n);
  let lockedMask = 0n;
  let remaining = n;
  let roundNum = 0;
  const rounds: PeelingRound[] = [];
  while (remaining > 0) {
    roundNum += 1;
    const { locked, roundMask } = runPeelingRound(doc, masks, lockedFlag, lockedMask, roundNum);
    lockedMask |= roundMask;
    remaining -= locked.length;
    for (let a = 0; a < n; a += 1) {
      if (!lockedFlag[a]) masks[a] = masks[a]! & ~lockedMask;
    }
    rounds.push(new PeelingRound(roundNum, locked, masks));
  }
  return new AllergenResolution(analysis, rounds);
}
