import type { DigitRun } from './candidate';

export type PolicyId = 'at-least-pair' | 'exact-pair';

/** Policy determining whether a password's adjacent digit runs satisfy puzzle rules. */
export interface RunLengthPolicy {
  readonly id: PolicyId;
  readonly name: string;
  readonly ruleSummary: string;
  acceptsRun(length: number): boolean;
  accepts(runs: readonly DigitRun[]): boolean;
}

class PredicateRunLengthPolicy implements RunLengthPolicy {
  readonly id: PolicyId;
  readonly name: string;
  readonly ruleSummary: string;
  private readonly predicate: (length: number) => boolean;

  constructor(
    id: PolicyId,
    name: string,
    ruleSummary: string,
    predicate: (length: number) => boolean,
  ) {
    this.id = id;
    this.name = name;
    this.ruleSummary = ruleSummary;
    this.predicate = predicate;
    Object.freeze(this);
  }

  acceptsRun(length: number): boolean {
    return this.predicate(length);
  }

  accepts(runs: readonly DigitRun[]): boolean {
    return runs.some((run) => this.acceptsRun(run.length));
  }
}

/** Part 1 policy: at least one contiguous run of 2 or more identical digits. */
export const AT_LEAST_PAIR_POLICY: RunLengthPolicy = new PredicateRunLengthPolicy(
  'at-least-pair',
  'At Least a Pair',
  'At least one run of 2 or more identical adjacent digits',
  (length) => length >= 2,
);

/** Part 2 policy: at least one contiguous run of exactly 2 identical digits. */
export const EXACT_PAIR_POLICY: RunLengthPolicy = new PredicateRunLengthPolicy(
  'exact-pair',
  'Exact Pair',
  'At least one run of exactly 2 identical adjacent digits',
  (length) => length === 2,
);
