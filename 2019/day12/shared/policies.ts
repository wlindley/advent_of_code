import type { MoonSystem } from './models';
import { analyzeSystemCycles, DEFAULT_MAX_AXIS_STEPS, simulateSteps } from './simulation';
import {
  buildAxisCycleTrace,
  buildOrbitStepTrace,
  type AxisCycleTraceFrame,
  type OrbitStepTraceFrame,
} from './trace';

/** Strategy interface separating Part 1 energy simulation from Part 2 cycle analysis. */
export interface NBodyPolicy<TAnswer, TTrace> {
  readonly id: string;
  readonly label: string;
  solve(system: MoonSystem): TAnswer;
  trace(system: MoonSystem, maxSteps: number): readonly TTrace[];
  formatAnswer(answer: TAnswer): string;
}

/** Creates a Part 1-style total energy policy after `steps` discrete ticks. */
export function createTotalEnergyPolicy(steps: number): NBodyPolicy<number, OrbitStepTraceFrame> {
  if (!Number.isSafeInteger(steps) || steps < 0) {
    throw new RangeError(`steps must be a non-negative safe integer, got ${steps}`);
  }
  return Object.freeze({
    id: `total-energy-${steps}`,
    label: `Total Energy @ ${steps} Steps`,
    solve: (system: MoonSystem) => simulateSteps(system, steps).totalEnergy,
    trace: (system: MoonSystem, maxSteps: number) => buildOrbitStepTrace(system, steps, maxSteps),
    formatAnswer: (answer: number) => String(answer),
  });
}

/** Canonical Part 1 policy computing total system energy after 1000 steps. */
export const TOTAL_ENERGY_1000_POLICY: NBodyPolicy<number, OrbitStepTraceFrame> = createTotalEnergyPolicy(1000);

/** Creates a Part 2-style policy finding the exact global repeat period via per-axis LCM. */
export function createFirstRepeatPeriodPolicy(maxAxisSteps: number): NBodyPolicy<bigint, AxisCycleTraceFrame> {
  if (!Number.isSafeInteger(maxAxisSteps) || maxAxisSteps < 1) {
    throw new RangeError(`maxAxisSteps must be a positive safe integer, got ${maxAxisSteps}`);
  }
  return Object.freeze({
    id: 'first-repeat-period',
    label: 'First Repeat Period',
    solve: (system: MoonSystem) => analyzeSystemCycles(system, maxAxisSteps).globalPeriod,
    trace: (system: MoonSystem, maxSteps: number) => buildAxisCycleTrace(system, maxAxisSteps, maxSteps),
    formatAnswer: (answer: bigint) => String(answer),
  });
}

/** Canonical Part 2 policy computing the first repeat step using DEFAULT_MAX_AXIS_STEPS. */
export const FIRST_REPEAT_PERIOD_POLICY: NBodyPolicy<bigint, AxisCycleTraceFrame> =
  createFirstRepeatPeriodPolicy(DEFAULT_MAX_AXIS_STEPS);
