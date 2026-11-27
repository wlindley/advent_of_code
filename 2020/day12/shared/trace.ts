import { sampleTraceIndices } from '../../../shared/core';
import { NavigationInstruction, ShipState } from './model';
import { stepNavigation, type NavigationRule } from './rules';

/** Default cap on emitted visualization trace frames. */
export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Immutable sampled snapshot along a ship navigation voyage. */
export class NavigationTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly instruction: NavigationInstruction | null;
  readonly state: ShipState;

  constructor(
    stepIndex: number,
    totalSteps: number,
    instruction: NavigationInstruction | null,
    state: ShipState,
  ) {
    if (!Number.isInteger(stepIndex) || stepIndex < 0) {
      throw new RangeError(`stepIndex must be a non-negative integer, got ${stepIndex}`);
    }
    if (!Number.isInteger(totalSteps) || totalSteps < stepIndex) {
      throw new RangeError(`totalSteps must be an integer >= stepIndex (${stepIndex}), got ${totalSteps}`);
    }
    if ((stepIndex === 0) !== (instruction === null)) {
      throw new Error('instruction must be null if and only if stepIndex === 0');
    }
    this.stepIndex = stepIndex;
    this.totalSteps = totalSteps;
    this.instruction = instruction;
    this.state = state;
    Object.freeze(this);
  }

  /** Whether this snapshot represents the completed voyage. */
  get isFinal(): boolean {
    return this.stepIndex === this.totalSteps;
  }
}

/** Records a bounded, endpoint-preserving single-pass navigation trace. */
export function traceNavigation(
  instructions: readonly NavigationInstruction[],
  rule: NavigationRule,
  maxSteps: number,
): readonly NavigationTraceFrame[] {
  const totalSteps = instructions.length;
  const sampled = sampleTraceIndices(totalSteps + 1, maxSteps);
  const frames: NavigationTraceFrame[] = [];
  let cursor = 0;
  let state = ShipState.initial(rule.initialVector);

  if (sampled[cursor] === 0) {
    frames.push(new NavigationTraceFrame(0, totalSteps, null, state));
    cursor += 1;
  }
  for (let i = 0; i < totalSteps; i += 1) {
    const instruction = instructions[i]!;
    state = stepNavigation(state, instruction, rule);
    const stepIndex = i + 1;
    if (sampled[cursor] === stepIndex) {
      frames.push(new NavigationTraceFrame(stepIndex, totalSteps, instruction, state));
      cursor += 1;
    }
  }
  return Object.freeze(frames);
}
