import { CustomsBatch, CustomsGroup } from './declaration';
import { assertValidQuestionMask, formatQuestionMask, popcount26 } from './question';

export type ConsensusPolicyId = 'any-yes' | 'all-yes';

/** Immutable consensus result for a single customs group under a policy. */
export class GroupConsensusResult {
  readonly policyId: ConsensusPolicyId;
  readonly mask: number;

  constructor(policyId: ConsensusPolicyId, mask: number) {
    assertValidQuestionMask(mask);
    this.policyId = policyId;
    this.mask = mask;
    Object.freeze(this);
  }

  get count(): number {
    return popcount26(this.mask);
  }

  get letters(): string {
    return formatQuestionMask(this.mask);
  }
}

export interface GroupConsensusPolicy {
  readonly id: ConsensusPolicyId;
  readonly label: string;
  readonly description: string;
  evaluate(group: CustomsGroup): GroupConsensusResult;
}

/** Base strategy evaluating a group's consensus by selecting a 26-bit mask. */
export abstract class BitmaskConsensusPolicy implements GroupConsensusPolicy {
  abstract readonly id: ConsensusPolicyId;
  abstract readonly label: string;
  abstract readonly description: string;

  protected abstract selectMask(group: CustomsGroup): number;

  evaluate(group: CustomsGroup): GroupConsensusResult {
    return new GroupConsensusResult(this.id, this.selectMask(group));
  }
}

/** Part 1 policy: count questions answered "yes" by anyone in the group (OR). */
export class AnyYesPolicy extends BitmaskConsensusPolicy {
  readonly id: ConsensusPolicyId = 'any-yes';
  readonly label = 'Any Yes (Union)';
  readonly description = 'Questions answered "yes" by at least one person in the group.';

  constructor() {
    super();
    Object.freeze(this);
  }

  protected selectMask(group: CustomsGroup): number {
    return group.anyYesMask;
  }
}

/** Part 2 policy: count questions answered "yes" by everyone in the group (AND). */
export class AllYesPolicy extends BitmaskConsensusPolicy {
  readonly id: ConsensusPolicyId = 'all-yes';
  readonly label = 'All Yes (Intersection)';
  readonly description = 'Questions answered "yes" by every person in the group.';

  constructor() {
    super();
    Object.freeze(this);
  }

  protected selectMask(group: CustomsGroup): number {
    return group.allYesMask;
  }
}

export const ANY_YES_POLICY = new AnyYesPolicy();
export const ALL_YES_POLICY = new AllYesPolicy();

/** Sums evaluated consensus counts across all groups in a batch. */
export function sumGroupConsensus(batch: CustomsBatch, policy: GroupConsensusPolicy): number {
  let total = 0;
  for (const group of batch.groups) {
    total += policy.evaluate(group).count;
  }
  return total;
}
