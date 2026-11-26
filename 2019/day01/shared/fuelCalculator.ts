import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { assertValidMass, type FuelPolicy } from './fuelPolicy';
import { parseModuleMasses, type ModuleManifest } from './moduleManifest';

export const DEFAULT_MAX_TRACE_STEPS = 120;

function assertNonNegativeInt(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${name} must be a non-negative safe integer, got ${value}`);
  }
}

function freezePositiveStages(stages: readonly number[]): readonly number[] {
  const validated: number[] = [];
  for (const stage of stages) {
    if (!Number.isSafeInteger(stage) || stage <= 0) {
      throw new RangeError(`Fuel stage must be a positive safe integer, got ${stage}`);
    }
    validated.push(stage);
  }
  return Object.freeze(validated);
}

function sumValues(values: readonly number[]): number {
  let total = 0;
  for (const value of values) total += value;
  return total;
}

/** Immutable telemetry snapshot for a single spacecraft module during fuel calculation. */
export class FuelTraceFrame {
  readonly moduleIndex: number;
  readonly mass: number;
  readonly stages: readonly number[];
  readonly priorCumulativeFuel: number;

  constructor(moduleIndex: number, mass: number, stages: readonly number[], priorCumulativeFuel: number) {
    assertNonNegativeInt(moduleIndex, 'moduleIndex');
    assertValidMass(mass);
    assertNonNegativeInt(priorCumulativeFuel, 'priorCumulativeFuel');
    this.moduleIndex = moduleIndex;
    this.mass = mass;
    this.stages = freezePositiveStages(stages);
    this.priorCumulativeFuel = priorCumulativeFuel;
    Object.freeze(this);
  }

  get baseFuel(): number {
    return this.stages[0] ?? 0;
  }

  get moduleFuel(): number {
    return sumValues(this.stages);
  }

  get extraFuel(): number {
    return this.moduleFuel - this.baseFuel;
  }

  get cumulativeFuel(): number {
    return this.priorCumulativeFuel + this.moduleFuel;
  }
}

/** Sums fuel requirements across all modules under the provided FuelPolicy. */
export function computeTotalFuel(manifest: ModuleManifest, policy: FuelPolicy): number {
  let total = 0;
  for (const mass of manifest.masses) total += policy.computeFuel(mass);
  return total;
}

/** Streams all modules to track exact cumulative fuel while emitting up to maxSteps sampled frames. */
export function traceFuelCalculation(manifest: ModuleManifest, policy: FuelPolicy, options?: TraceOptions): readonly FuelTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const sampled = sampleTraceIndices(manifest.count, limit);
  const frames: FuelTraceFrame[] = [];
  let priorFuel = 0;
  let sampleCursor = 0;
  for (let i = 0; i < manifest.masses.length; i += 1) {
    const mass = manifest.masses[i]!;
    const stages = policy.fuelStages(mass);
    if (i === sampled[sampleCursor]) {
      frames.push(new FuelTraceFrame(i, mass, stages, priorFuel));
      sampleCursor += 1;
    }
    priorFuel += sumValues(stages);
  }
  return Object.freeze(frames);
}

/** Binds a FuelPolicy to the shared PuzzleSolver contract. */
export function createFuelSolver(policy: FuelPolicy): Required<PuzzleSolver<ModuleManifest, number, FuelTraceFrame>> {
  return Object.freeze({
    parse: parseModuleMasses,
    solve: (manifest: ModuleManifest) => computeTotalFuel(manifest, policy),
    trace: (manifest: ModuleManifest, options?: TraceOptions) => traceFuelCalculation(manifest, policy, options),
  });
}
