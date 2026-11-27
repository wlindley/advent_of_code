/** Strategy governing how many times a regular small cave may be revisited along a path. */
export interface CaveVisitPolicy {
  readonly name: string;
  readonly initialRevisitBudget: number;
  /** Returns the remaining budget after entering a small cave, or `-1` if forbidden. */
  enterSmallCave(revisitBudget: number, alreadyVisited: boolean): number;
}

/** Fixed-budget small-cave revisit policy shared by Part 1 (0) and Part 2 (1). */
export class FixedRevisitPolicy implements CaveVisitPolicy {
  readonly name: string;
  readonly initialRevisitBudget: number;

  constructor(name: string, initialRevisitBudget: number) {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new Error('Policy name must be a non-empty string');
    }
    if (!Number.isInteger(initialRevisitBudget) || initialRevisitBudget < 0) {
      throw new RangeError(
        `Initial revisit budget must be a non-negative integer, got ${initialRevisitBudget}`,
      );
    }
    this.name = trimmed;
    this.initialRevisitBudget = initialRevisitBudget;
    Object.freeze(this);
  }

  enterSmallCave(revisitBudget: number, alreadyVisited: boolean): number {
    if (!alreadyVisited) return revisitBudget;
    return revisitBudget > 0 ? revisitBudget - 1 : -1;
  }
}

/** Part 1 policy: every regular small cave may be visited at most once. */
export const NO_REVISIT_POLICY: CaveVisitPolicy = new FixedRevisitPolicy(
  'No small cave revisits',
  0,
);

/** Part 2 policy: at most one regular small cave may be visited twice. */
export const SINGLE_SMALL_REVISIT_POLICY: CaveVisitPolicy = new FixedRevisitPolicy(
  'One small cave revisit',
  1,
);
