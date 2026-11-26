import type { PacketOrder } from './comparator';
import { PacketList, type PacketValue } from './packet';

export type ComparisonStepKind =
  | 'compare-list'
  | 'compare-int'
  | 'promote-left'
  | 'promote-right'
  | 'left-exhausted'
  | 'right-exhausted';

export interface ComparisonStep {
  readonly kind: ComparisonStepKind;
  readonly depth: number;
  readonly leftText: string;
  readonly rightText: string;
  readonly outcome: PacketOrder | null;
}

/** Immutable trace of every step taken while comparing two packets. */
export class ComparisonTrace {
  readonly outcome: PacketOrder;
  readonly steps: readonly ComparisonStep[];

  constructor(outcome: PacketOrder, steps: readonly ComparisonStep[]) {
    this.outcome = outcome;
    this.steps = Object.freeze(steps.map((step) => Object.freeze({ ...step })));
    Object.freeze(this);
  }
}

function pushStep(
  steps: ComparisonStep[],
  kind: ComparisonStepKind,
  depth: number,
  leftText: string,
  rightText: string,
  outcome: PacketOrder | null,
): void {
  steps.push({ kind, depth, leftText, rightText, outcome });
}

function traceValue(
  left: PacketValue,
  right: PacketValue,
  depth: number,
  steps: ComparisonStep[],
): PacketOrder {
  if (left.kind === 'int') {
    if (right.kind === 'int') {
      const outcome: PacketOrder = left.value < right.value ? -1 : left.value > right.value ? 1 : 0;
      pushStep(steps, 'compare-int', depth, left.format(), right.format(), outcome);
      return outcome;
    }
    pushStep(steps, 'promote-left', depth, left.format(), right.format(), null);
    return traceLists(new PacketList([left]), right, depth, steps);
  }
  if (right.kind === 'int') {
    pushStep(steps, 'promote-right', depth, left.format(), right.format(), null);
    return traceLists(left, new PacketList([right]), depth, steps);
  }
  return traceLists(left, right, depth, steps);
}

function traceLists(
  left: PacketList,
  right: PacketList,
  depth: number,
  steps: ComparisonStep[],
): PacketOrder {
  pushStep(steps, 'compare-list', depth, left.format(), right.format(), null);
  const limit = Math.min(left.length, right.length);
  for (let i = 0; i < limit; i += 1) {
    const outcome = traceValue(left.items[i]!, right.items[i]!, depth + 1, steps);
    if (outcome !== 0) {
      return outcome;
    }
  }
  if (left.length < right.length) {
    pushStep(steps, 'left-exhausted', depth, left.format(), right.format(), -1);
    return -1;
  }
  if (left.length > right.length) {
    pushStep(steps, 'right-exhausted', depth, left.format(), right.format(), 1);
    return 1;
  }
  return 0;
}

/** Builds a step-by-step comparison trace using structural single-item list promotion. */
export function traceComparison(left: PacketList, right: PacketList): ComparisonTrace {
  const steps: ComparisonStep[] = [];
  const outcome = traceLists(left, right, 0, steps);
  return new ComparisonTrace(outcome, steps);
}
