import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { CustomsBatch, CustomsGroup } from './declaration';
import { GroupConsensusPolicy, GroupConsensusResult } from './policy';

export const DEFAULT_MAX_TRACE_STEPS = 80;

function assertValidFrameArgs(
  groupIndex: number,
  totalGroups: number,
  consensus: GroupConsensusResult,
  runningSum: number,
): void {
  if (!Number.isInteger(totalGroups) || totalGroups < 1) {
    throw new RangeError(`totalGroups must be >= 1, got ${totalGroups}`);
  }
  if (!Number.isInteger(groupIndex) || groupIndex < 0 || groupIndex >= totalGroups) {
    throw new RangeError(`groupIndex must be in [0, ${totalGroups - 1}], got ${groupIndex}`);
  }
  if (!Number.isInteger(runningSum) || runningSum < consensus.count) {
    throw new RangeError(`runningSum (${runningSum}) must be an integer >= ${consensus.count}`);
  }
}

/** Immutable visualization frame capturing one sampled customs group and running total. */
export class CustomsTraceFrame {
  readonly groupIndex: number;
  readonly totalGroups: number;
  readonly group: CustomsGroup;
  readonly consensus: GroupConsensusResult;
  readonly runningSum: number;

  constructor(
    groupIndex: number,
    totalGroups: number,
    group: CustomsGroup,
    consensus: GroupConsensusResult,
    runningSum: number,
  ) {
    assertValidFrameArgs(groupIndex, totalGroups, consensus, runningSum);
    this.groupIndex = groupIndex;
    this.totalGroups = totalGroups;
    this.group = group;
    this.consensus = consensus;
    this.runningSum = runningSum;
    Object.freeze(this);
  }

  get groupNumber(): number {
    return this.groupIndex + 1;
  }

  get anyYesMask(): number {
    return this.group.anyYesMask;
  }

  get allYesMask(): number {
    return this.group.allYesMask;
  }

  get partialOnlyMask(): number {
    return this.anyYesMask & ~this.allYesMask;
  }
}

/** Traces a customs batch under `policy`, uniformly sampling up to `maxSteps` frames. */
export function traceCustomsBatch(
  batch: CustomsBatch,
  policy: GroupConsensusPolicy,
  maxSteps?: number,
): readonly CustomsTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampledIndices = sampleTraceIndices(batch.groupCount, limit);
  const frames: CustomsTraceFrame[] = [];
  let runningSum = 0;
  let sampleCursor = 0;

  for (let i = 0; i < batch.groupCount; i += 1) {
    const group = batch.groups[i] as CustomsGroup;
    const consensus = policy.evaluate(group);
    runningSum += consensus.count;
    if (sampledIndices[sampleCursor] === i) {
      frames.push(new CustomsTraceFrame(i, batch.groupCount, group, consensus, runningSum));
      sampleCursor += 1;
    }
  }
  return Object.freeze(frames);
}
