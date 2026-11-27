import { sampleTraceIndices, validateMaxSteps, type TraceOptions } from '../../../shared/core';
import type { SnailfishPolicy } from './policy';
import { buffersToNumber, stepReduceBuffers } from './reducer';
import type { SnailfishHomework, SnailfishNumber } from './snailfish';

export const DEFAULT_MAX_TRACE_STEPS = 64;

export type SnailfishTraceKind = 'initial' | 'add' | 'explode' | 'split';

interface RawTraceEvent {
  readonly kind: SnailfishTraceKind;
  readonly operandIndex: number;
  readonly focusIndex: number;
  readonly values: readonly number[];
  readonly depths: readonly number[];
}

/** Immutable sampled trace snapshot for one snailfish addition or reduction step. */
export class SnailfishTraceFrame {
  constructor(
    readonly step: number,
    readonly totalRawSteps: number,
    readonly rawIndex: number,
    readonly kind: SnailfishTraceKind,
    readonly operandIndex: number,
    readonly totalOperands: number,
    readonly focusIndex: number,
    readonly current: SnailfishNumber,
    readonly planDescription: string,
  ) {
    Object.freeze(this);
  }

  get magnitude(): number {
    return this.current.magnitude;
  }

  get maxDepth(): number {
    return this.current.maxDepth;
  }

  get leafCount(): number {
    return this.current.leafCount;
  }

  get isComplete(): boolean {
    return this.rawIndex === this.totalRawSteps - 1;
  }

  get expression(): string {
    return this.current.toString();
  }

  get progressRatio(): number {
    return this.totalRawSteps <= 1 ? 1 : this.rawIndex / (this.totalRawSteps - 1);
  }
}

function appendOperand(values: number[], depths: number[], operand: SnailfishNumber): void {
  for (let i = 0; i < depths.length; i += 1) {
    depths[i]! += 1;
  }
  for (const leaf of operand.leaves) {
    values.push(leaf.value);
    depths.push(leaf.depth + 1);
  }
}

function pushRawEvent(
  events: RawTraceEvent[],
  kind: SnailfishTraceKind,
  operandIndex: number,
  focusIndex: number,
  values: readonly number[],
  depths: readonly number[],
): void {
  events.push({
    kind,
    operandIndex,
    focusIndex,
    values: values.slice(),
    depths: depths.slice(),
  });
}

function buildRawTraceEvents(operands: readonly SnailfishNumber[]): readonly RawTraceEvent[] {
  const first = operands[0]!;
  const values = first.leaves.map((leaf) => leaf.value);
  const depths = first.leaves.map((leaf) => leaf.depth);
  const events: RawTraceEvent[] = [];
  pushRawEvent(events, 'initial', 0, -1, values, depths);
  for (let opIdx = 1; opIdx < operands.length; opIdx += 1) {
    appendOperand(values, depths, operands[opIdx]!);
    pushRawEvent(events, 'add', opIdx, -1, values, depths);
    while (true) {
      const action = stepReduceBuffers(values, depths);
      if (action === null) break;
      pushRawEvent(events, action.kind, opIdx, action.focusIndex, values, depths);
    }
  }
  return events;
}

/** Generates uniformly sampled addition and reduction frames for the given policy. */
export function traceSnailfish(
  homework: SnailfishHomework,
  policy: SnailfishPolicy,
  options?: TraceOptions,
): readonly SnailfishTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const plan = policy.planTrace(homework);
  const rawEvents = buildRawTraceEvents(plan.operands);
  const sampled = sampleTraceIndices(rawEvents.length, limit);
  const frames = sampled.map((rawIndex, step) => {
    const ev = rawEvents[rawIndex]!;
    const current = buffersToNumber(ev.values, ev.depths);
    return new SnailfishTraceFrame(
      step,
      rawEvents.length,
      rawIndex,
      ev.kind,
      ev.operandIndex,
      plan.operands.length,
      ev.focusIndex,
      current,
      plan.description,
    );
  });
  return Object.freeze(frames);
}
