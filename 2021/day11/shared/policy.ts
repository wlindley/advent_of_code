import type { OctopusGrid } from './grid';
import { OctopusStepper } from './stepper';

export const DEFAULT_MAX_SYNC_STEPS = 100_000;

/** Strategy interface decoupling simulation termination and answer extraction across Day 11 parts. */
export interface OctopusPolicy {
  readonly id: string;
  readonly label: string;
  readonly metricLabel: string;
  simulate(grid: OctopusGrid): readonly number[];
  extractAnswer(flashHistory: readonly number[]): number;
}

function assertPositiveInt(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer, got ${value}`);
  }
}

class FixedStepsPolicy implements OctopusPolicy {
  readonly id: string;
  readonly label: string;
  readonly metricLabel = 'Total Flashes';
  private readonly steps: number;

  constructor(steps: number) {
    assertPositiveInt(steps, 'steps');
    this.steps = steps;
    this.id = `fixed-steps-${steps}`;
    this.label = `${steps} Steps`;
    Object.freeze(this);
  }

  simulate(grid: OctopusGrid): readonly number[] {
    const stepper = new OctopusStepper(grid);
    const history: number[] = [];
    for (let step = 0; step < this.steps; step += 1) {
      history.push(stepper.step());
    }
    return Object.freeze(history);
  }

  extractAnswer(flashHistory: readonly number[]): number {
    let total = 0;
    for (let i = 0; i < flashHistory.length; i += 1) {
      total += flashHistory[i]!;
    }
    return total;
  }
}

class FirstSyncPolicy implements OctopusPolicy {
  readonly id = 'first-sync-step';
  readonly label = 'First Synchronized Flash';
  readonly metricLabel = 'Step Flashes';
  private readonly maxSteps: number;

  constructor(maxSteps: number) {
    assertPositiveInt(maxSteps, 'maxSteps');
    this.maxSteps = maxSteps;
    Object.freeze(this);
  }

  simulate(grid: OctopusGrid): readonly number[] {
    const stepper = new OctopusStepper(grid);
    const history: number[] = [];
    for (let step = 1; step <= this.maxSteps; step += 1) {
      const flashes = stepper.step();
      history.push(flashes);
      if (flashes === grid.size) {
        return Object.freeze(history);
      }
    }
    throw new RangeError(`Octopuses did not synchronize within ${this.maxSteps} steps`);
  }

  extractAnswer(flashHistory: readonly number[]): number {
    return flashHistory.length;
  }
}

/** Creates a policy that simulates a fixed number of steps and sums total flashes. */
export function createFixedStepsPolicy(steps: number): OctopusPolicy {
  return new FixedStepsPolicy(steps);
}

/** Creates a policy that simulates until all octopuses flash together (up to `maxSteps`). */
export function createFirstSyncPolicy(maxSteps: number): OctopusPolicy {
  return new FirstSyncPolicy(maxSteps);
}

export const TOTAL_FLASHES_100_POLICY: OctopusPolicy = createFixedStepsPolicy(100);
export const FIRST_SYNC_STEP_POLICY: OctopusPolicy = createFirstSyncPolicy(DEFAULT_MAX_SYNC_STEPS);
