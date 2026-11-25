import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { DIAL_SIZE, INITIAL_DIAL_POSITION, parseRotations, type Rotation } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 250;

/** Immutable trace frame capturing dial click-method telemetry with derived getters. */
export class DialClickTraceFrame {
  constructor(
    readonly step: number,
    readonly rotation: Rotation | null,
    readonly fromPosition: number,
    readonly totalZeroHits: number,
  ) {
    Object.freeze(this);
  }

  get toPosition(): number {
    return this.rotation ? this.rotation.applyTo(this.fromPosition) : this.fromPosition;
  }

  get stepZeroHits(): number {
    return this.rotation ? this.rotation.countZeroHitsFrom(this.fromPosition) : 0;
  }

  get landedOnZero(): boolean {
    return this.rotation !== null && this.toPosition === 0;
  }

  get midRotationHits(): number {
    return this.stepZeroHits - (this.landedOnZero ? 1 : 0);
  }

  get fullTurns(): number {
    return this.rotation ? Math.floor(this.rotation.distance / DIAL_SIZE) : 0;
  }
}

export const solver: PuzzleSolver<readonly Rotation[], number, DialClickTraceFrame> = {
  parse(raw: string): readonly Rotation[] {
    return parseRotations(raw);
  },

  solve(rotations: readonly Rotation[]): number {
    let position = INITIAL_DIAL_POSITION;
    let totalZeroHits = 0;
    for (const rotation of rotations) {
      totalZeroHits += rotation.countZeroHitsFrom(position);
      position = rotation.applyTo(position);
    }
    return totalZeroHits;
  },

  trace(rotations: readonly Rotation[], options?: TraceOptions): readonly DialClickTraceFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    }
    if (rotations.length === 0) {
      return [new DialClickTraceFrame(0, null, INITIAL_DIAL_POSITION, 0)];
    }

    const stride =
      maxSteps === 1
        ? Number.POSITIVE_INFINITY
        : rotations.length + 1 <= maxSteps
          ? 1
          : Math.ceil(rotations.length / (maxSteps - 1));

    const frames: DialClickTraceFrame[] = [];
    let position = INITIAL_DIAL_POSITION;
    let totalZeroHits = 0;
    if (maxSteps > 1) frames.push(new DialClickTraceFrame(0, null, position, 0));

    for (const [index, rotation] of rotations.entries()) {
      const fromPosition = position;
      totalZeroHits += rotation.countZeroHitsFrom(fromPosition);
      position = rotation.applyTo(fromPosition);
      const step = index + 1;
      if (step % stride === 0 || step === rotations.length) {
        frames.push(new DialClickTraceFrame(step, rotation, fromPosition, totalZeroHits));
      }
    }
    return frames;
  },
};
