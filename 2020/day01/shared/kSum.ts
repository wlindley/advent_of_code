import type { ExpenseEntry, ExpenseReport } from './expenseReport';

export const TARGET_EXPENSE_SUM = 2020;

export type ProbeVerdict = 'too-low' | 'match' | 'too-high';

export interface ProbeObserver {
  onProbe(
    sorted: readonly ExpenseEntry[], anchorPositions: readonly number[],
    leftPos: number, rightPos: number, sum: number, verdict: ProbeVerdict,
  ): boolean;
}

/** Classifies a candidate tuple sum against the target expense sum. */
export function classifySum(sum: number, target: number): ProbeVerdict {
  if (sum < target) return 'too-low';
  if (sum > target) return 'too-high';
  return 'match';
}

/** Validated, immutable k-tuple of matching expense entries. */
export class ExpenseMatch {
  readonly #entries: readonly ExpenseEntry[];

  constructor(entries: readonly ExpenseEntry[]) {
    if (entries.length < 2) {
      throw new RangeError(`ExpenseMatch requires at least 2 entries, got ${entries.length}`);
    }
    this.#entries = Object.freeze([...entries]);
    Object.freeze(this);
  }

  get entries(): readonly ExpenseEntry[] { return this.#entries; }
  get sum(): number { return this.#entries.reduce((acc, entry) => acc + entry.value, 0); }
  get product(): number { return this.#entries.reduce((acc, entry) => acc * entry.value, 1); }
}

function validateKSumArgs(report: ExpenseReport, tupleSize: number, target: number): void {
  if (!Number.isInteger(tupleSize) || tupleSize < 2) {
    throw new RangeError(`tupleSize must be an integer >= 2, got ${tupleSize}`);
  }
  if (!Number.isSafeInteger(target) || target < 0) {
    throw new RangeError(`target must be a non-negative safe integer, got ${target}`);
  }
  if (report.size < tupleSize) {
    throw new RangeError(`ExpenseReport size (${report.size}) is smaller than tupleSize (${tupleSize})`);
  }
}

function twoPointerScan(
  sorted: readonly ExpenseEntry[], anchorPositions: readonly number[], anchorSum: number,
  startIndex: number, target: number, observer: ProbeObserver,
): boolean {
  let left = startIndex;
  let right = sorted.length - 1;
  while (left < right) {
    // Invariant: startIndex <= left < right < sorted.length, so indexed entries always exist.
    const sum = anchorSum + sorted[left]!.value + sorted[right]!.value;
    const verdict = classifySum(sum, target);
    if (observer.onProbe(sorted, anchorPositions, left, right, sum, verdict)) return true;
    if (verdict === 'too-low') left += 1;
    else right -= 1;
  }
  return false;
}

function walkRecursive(
  sorted: readonly ExpenseEntry[], remaining: number, startIndex: number,
  anchorPositions: number[], anchorSum: number, target: number, observer: ProbeObserver,
): boolean {
  if (remaining === 2) return twoPointerScan(sorted, anchorPositions, anchorSum, startIndex, target, observer);
  const maxAnchor = sorted.length - remaining;
  for (let i = startIndex; i <= maxAnchor; i += 1) {
    // Invariant: i <= sorted.length - remaining < sorted.length, so sorted[i] exists.
    anchorPositions.push(i);
    const stopped = walkRecursive(
      sorted, remaining - 1, i + 1, anchorPositions, anchorSum + sorted[i]!.value, target, observer,
    );
    anchorPositions.pop();
    if (stopped) return true;
  }
  return false;
}

/** Walks sorted k-sum two-pointer probes and notifies `observer` on every candidate tuple. */
export function walkKSum(report: ExpenseReport, tupleSize: number, target: number, observer: ProbeObserver): boolean {
  validateKSumArgs(report, tupleSize, target);
  return walkRecursive(report.sortedEntries(), tupleSize, 0, [], 0, target, observer);
}

class MatchObserver implements ProbeObserver {
  match: ExpenseMatch | null = null;

  onProbe(
    sorted: readonly ExpenseEntry[], anchorPositions: readonly number[],
    leftPos: number, rightPos: number, _sum: number, verdict: ProbeVerdict,
  ): boolean {
    if (verdict !== 'match') return false;
    this.match = new ExpenseMatch([...anchorPositions.map((pos) => sorted[pos]!), sorted[leftPos]!, sorted[rightPos]!]);
    return true;
  }
}

/** Finds the first sorted `tupleSize`-tuple whose entries sum to `target`, or `null` if none exists. */
export function findKSumTuple(report: ExpenseReport, tupleSize: number, target: number): ExpenseMatch | null {
  const observer = new MatchObserver();
  walkKSum(report, tupleSize, target, observer);
  return observer.match;
}
