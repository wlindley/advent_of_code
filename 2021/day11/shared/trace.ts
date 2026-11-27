import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import type { OctopusGrid } from './grid';
import { OctopusStepper } from './stepper';

export const DEFAULT_TRACE_MAX_STEPS = 250;

function validateHistory(flashHistory: readonly number[], maxCellFlashes: number): readonly number[] {
  for (let i = 0; i < flashHistory.length; i += 1) {
    const count = flashHistory[i]!;
    if (!Number.isInteger(count) || count < 0 || count > maxCellFlashes) {
      throw new RangeError(
        `flashHistory[${i}] must be an integer in [0, ${maxCellFlashes}], got ${count}`,
      );
    }
  }
  return Object.isFrozen(flashHistory) ? flashHistory : Object.freeze(flashHistory.slice());
}

/** Immutable simulation snapshot at a given step with dynamically derived flash metrics. */
export class OctopusStepFrame {
  readonly step: number;
  readonly grid: OctopusGrid;
  readonly flashHistory: readonly number[];

  constructor(step: number, grid: OctopusGrid, flashHistory: readonly number[]) {
    if (!Number.isInteger(step) || step < 0 || step > flashHistory.length) {
      throw new RangeError(`step must be an integer in [0, ${flashHistory.length}], got ${step}`);
    }
    this.step = step;
    this.grid = grid;
    this.flashHistory = validateHistory(flashHistory, grid.size);
    Object.freeze(this);
  }

  get stepFlashes(): number {
    return this.step === 0 ? 0 : this.flashHistory[this.step - 1]!;
  }

  get totalFlashes(): number {
    let total = 0;
    for (let i = 0; i < this.step; i += 1) {
      total += this.flashHistory[i]!;
    }
    return total;
  }

  get isSynchronized(): boolean {
    return this.stepFlashes === this.grid.size;
  }

  flashedAt(row: number, col: number): boolean {
    const energy = this.grid.at(row, col);
    return this.step > 0 && energy === 0;
  }
}

/** Replays `grid` across `flashHistory.length` steps and samples up to `maxSteps` endpoint-preserving frames. */
export function captureSampledTrace(
  grid: OctopusGrid,
  flashHistory: readonly number[],
  maxSteps: number,
): readonly OctopusStepFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const totalSteps = flashHistory.length;
  const sampled = sampleTraceIndices(totalSteps + 1, limit);
  const frozenHistory = validateHistory(flashHistory, grid.size);
  const stepper = new OctopusStepper(grid);
  const frames: OctopusStepFrame[] = [];
  let samplePos = 0;
  for (let step = 0; step <= totalSteps; step += 1) {
    if (step > 0) stepper.step();
    if (sampled[samplePos] === step) {
      frames.push(new OctopusStepFrame(step, stepper.snapshot(), frozenHistory));
      samplePos += 1;
    }
  }
  return Object.freeze(frames);
}
