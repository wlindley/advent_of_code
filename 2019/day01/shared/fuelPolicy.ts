/** Validates that a spacecraft mass is a non-negative safe integer. */
export function assertValidMass(mass: number): void {
  if (!Number.isSafeInteger(mass) || mass < 0) {
    throw new RangeError(`Mass must be a non-negative safe integer, got ${mass}`);
  }
}

/** Computes one clamped step of rocket fuel: max(0, floor(mass / 3) - 2). */
export function computeStepFuel(mass: number): number {
  assertValidMass(mass);
  return Math.max(0, Math.floor(mass / 3) - 2);
}

/** Strategy interface for computing spacecraft module fuel requirements. */
export interface FuelPolicy {
  readonly label: string;
  computeFuel(mass: number): number;
  fuelStages(mass: number): readonly number[];
}

class SingleStageFuelPolicy implements FuelPolicy {
  readonly label = 'Single-Stage Fuel';

  constructor() {
    Object.freeze(this);
  }

  computeFuel(mass: number): number {
    return computeStepFuel(mass);
  }

  fuelStages(mass: number): readonly number[] {
    const fuel = computeStepFuel(mass);
    return Object.freeze(fuel > 0 ? [fuel] : []);
  }
}

class RecursiveFuelPolicy implements FuelPolicy {
  readonly label = 'Recursive Fuel';

  constructor() {
    Object.freeze(this);
  }

  computeFuel(mass: number): number {
    let total = 0;
    for (const stage of this.fuelStages(mass)) {
      total += stage;
    }
    return total;
  }

  fuelStages(mass: number): readonly number[] {
    const stages: number[] = [];
    let current = computeStepFuel(mass);
    while (current > 0) {
      stages.push(current);
      current = computeStepFuel(current);
    }
    return Object.freeze(stages);
  }
}

/** Part 1 policy: single step of fuel per module mass without fuel-for-fuel recursion. */
export const SINGLE_STAGE_FUEL_POLICY: FuelPolicy = new SingleStageFuelPolicy();

/** Part 2 policy: recursively adds fuel stages until the marginal requirement reaches zero. */
export const RECURSIVE_FUEL_POLICY: FuelPolicy = new RecursiveFuelPolicy();
