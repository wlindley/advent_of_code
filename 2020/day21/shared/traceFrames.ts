import { bitCount } from '../../../shared/core';
import type { AllergenAssignment } from './analysis';
import type { AllergenDocument, Food } from './model';

export const DEFAULT_MAX_TRACE_STEPS = 80;

export interface IntersectionTraceFrameInit {
  readonly foodIndex: number;
  readonly doc: AllergenDocument;
  readonly candidateMasks: readonly bigint[];
}

/** Immutable trace snapshot after intersecting a single food's ingredient mask. */
export class IntersectionTraceFrame {
  readonly kind = 'intersection' as const;
  readonly foodIndex: number;
  readonly doc: AllergenDocument;
  readonly candidateMasks: readonly bigint[];

  constructor(init: IntersectionTraceFrameInit) {
    this.foodIndex = init.foodIndex;
    this.doc = init.doc;
    this.candidateMasks = Object.freeze([...init.candidateMasks]);
    Object.freeze(this);
  }

  get scannedCount(): number { return this.foodIndex + 1; }
  get totalFoods(): number { return this.doc.foodCount; }
  get isFinal(): boolean { return this.scannedCount === this.totalFoods; }
  get currentFood(): Food { return this.doc.foods[this.foodIndex]!; }

  get suspectMask(): bigint {
    let mask = 0n;
    for (const m of this.candidateMasks) mask |= m;
    return mask;
  }

  get safeMask(): bigint { return this.doc.allIngredientsMask & ~this.suspectMask; }
  get safeCount(): number { return bitCount(this.safeMask); }
  get suspectCount(): number { return this.doc.ingredientCount - this.safeCount; }

  get runningSafeAppearances(): number {
    const safe = this.safeMask;
    const freqs = this.doc.ingredientFrequencies;
    let total = 0;
    for (let i = 0; i < this.doc.ingredientCount; i += 1) {
      if ((safe & (1n << BigInt(i))) !== 0n) total += freqs[i]!;
    }
    return total;
  }
}

export interface PeelingTraceFrameInit {
  readonly roundNumber: number;
  readonly totalRounds: number;
  readonly doc: AllergenDocument;
  readonly suspectIngredientIds: readonly number[];
  readonly masks: readonly bigint[];
  readonly priorAssignments: readonly AllergenAssignment[];
  readonly activeLocks: readonly AllergenAssignment[];
  readonly safeAppearances: number;
}

/** Immutable trace snapshot for a single allergen singleton-peeling round. */
export class PeelingTraceFrame {
  readonly kind = 'peeling' as const;
  readonly roundNumber: number;
  readonly totalRounds: number;
  readonly doc: AllergenDocument;
  readonly suspectIngredientIds: readonly number[];
  readonly masks: readonly bigint[];
  readonly priorAssignments: readonly AllergenAssignment[];
  readonly activeLocks: readonly AllergenAssignment[];
  readonly safeAppearances: number;

  constructor(init: PeelingTraceFrameInit) {
    this.roundNumber = init.roundNumber;
    this.totalRounds = init.totalRounds;
    this.doc = init.doc;
    this.suspectIngredientIds = Object.freeze([...init.suspectIngredientIds]);
    this.masks = Object.freeze([...init.masks]);
    this.priorAssignments = Object.freeze([...init.priorAssignments]);
    this.activeLocks = Object.freeze([...init.activeLocks]);
    this.safeAppearances = init.safeAppearances;
    Object.freeze(this);
  }

  get isFinal(): boolean { return this.roundNumber === this.totalRounds; }
  get lockedCount(): number { return this.priorAssignments.length + this.activeLocks.length; }

  get canonicalDangerousSoFar(): string {
    const combined = [...this.priorAssignments, ...this.activeLocks];
    combined.sort((a, b) => a.allergenId - b.allergenId);
    return combined.map((entry) => entry.ingredient).join(',');
  }
}

export type AllergenTraceFrame = IntersectionTraceFrame | PeelingTraceFrame;
