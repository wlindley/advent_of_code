import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  INITIAL_DIAL_POSITION,
  parseRotations,
  type Rotation,
} from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 250;

export interface DialTraceFrame {
  readonly step: number;
  readonly rotation: Rotation | null;
  readonly fromPosition: number;
  readonly toPosition: number;
  readonly zeroCount: number;
}

export const solver: PuzzleSolver<readonly Rotation[], number, DialTraceFrame> = {
  parse(raw: string): readonly Rotation[] {
    return parseRotations(raw);
  },

  solve(rotations: readonly Rotation[]): number {
    let position = INITIAL_DIAL_POSITION;
    let zeroCount = 0;
    for (const rotation of rotations) {
      position = rotation.applyTo(position);
      if (position === 0) zeroCount += 1;
    }
    return zeroCount;
  },

  trace(rotations: readonly Rotation[], options?: TraceOptions): readonly DialTraceFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    }

    const stride =
      maxSteps === 1
        ? Number.POSITIVE_INFINITY
        : rotations.length + 1 <= maxSteps
          ? 1
          : Math.ceil(rotations.length / (maxSteps - 1));

    const frames: DialTraceFrame[] = [];
    let position = INITIAL_DIAL_POSITION;
    let zeroCount = 0;
    let lastFrame: DialTraceFrame = {
      step: 0,
      rotation: null,
      fromPosition: position,
      toPosition: position,
      zeroCount,
    };

    if (maxSteps > 1) frames.push(lastFrame);

    for (const [index, rotation] of rotations.entries()) {
      const fromPosition = position;
      position = rotation.applyTo(fromPosition);
      if (position === 0) zeroCount += 1;
      const step = index + 1;
      lastFrame = { step, rotation, fromPosition, toPosition: position, zeroCount };
      if (step % stride === 0) frames.push(lastFrame);
    }

    // Ensure the final state is always included even when N is not divisible by stride.
    if (frames.at(-1) !== lastFrame) frames.push(lastFrame);
    return frames;
  },
};
