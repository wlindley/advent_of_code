export const DEFAULT_MAX_TRACE_STEPS = 120;

export const PAIR_RELATIONS = Object.freeze([
  'identical',
  'first-contains-second',
  'second-contains-first',
  'partial-overlap',
  'disjoint',
] as const);

export type PairRelation = (typeof PAIR_RELATIONS)[number];

export type RelationCounts = Readonly<Record<PairRelation, number>>;

/** Returns a fresh mutable zero-initialized relation counter record. */
export function createEmptyRelationCounts(): Record<PairRelation, number> {
  return {
    identical: 0,
    'first-contains-second': 0,
    'second-contains-first': 0,
    'partial-overlap': 0,
    disjoint: 0,
  };
}

function copyValidatedCounts(counts: RelationCounts): RelationCounts {
  const copy = createEmptyRelationCounts();
  for (const relation of PAIR_RELATIONS) {
    const value = counts[relation];
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new RangeError(`Relation count for "${relation}" must be a non-negative safe integer, got ${value}`);
    }
    copy[relation] = value;
  }
  return Object.freeze(copy);
}

/** Immutable cumulative snapshot of pair-relation frequencies with dynamic aggregate getters. */
export class RelationTally {
  readonly counts: RelationCounts;

  constructor(counts: RelationCounts) {
    this.counts = copyValidatedCounts(counts);
    Object.freeze(this);
  }

  get totalPairs(): number {
    return this.overlapCount + this.disjointCount;
  }

  get fullContainmentCount(): number {
    return (
      this.counts.identical +
      this.counts['first-contains-second'] +
      this.counts['second-contains-first']
    );
  }

  get overlapCount(): number {
    return this.fullContainmentCount + this.counts['partial-overlap'];
  }

  get disjointCount(): number {
    return this.counts.disjoint;
  }

  countOf(relation: PairRelation): number {
    return this.counts[relation];
  }
}
