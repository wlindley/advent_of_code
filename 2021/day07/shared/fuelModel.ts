export type FuelModelId = 'linear' | 'triangular';

/** Strategy interface computing fuel expended for a non-negative alignment distance. */
export interface FuelCostModel {
  readonly id: FuelModelId;
  readonly label: string;
  costForDistance(distance: bigint): bigint;
}

/** Exact absolute difference `|a - b|` for arbitrary-precision BigInts. */
export function absDiffBigInt(a: bigint, b: bigint): bigint {
  return a >= b ? a - b : b - a;
}

function requireNonNegativeDistance(distance: bigint): void {
  if (distance < 0n) {
    throw new RangeError(`Distance must be non-negative, got ${distance}`);
  }
}

/** Constant 1-fuel-per-step cost model (`cost(d) = d`). */
export class LinearFuelModel implements FuelCostModel {
  readonly id: FuelModelId = 'linear';
  readonly label = 'Linear (1 fuel/step)';

  constructor() {
    Object.freeze(this);
  }

  costForDistance(distance: bigint): bigint {
    requireNonNegativeDistance(distance);
    return distance;
  }
}

/** Triangular step cost model (`cost(d) = d * (d + 1) / 2`). */
export class TriangularFuelModel implements FuelCostModel {
  readonly id: FuelModelId = 'triangular';
  readonly label = 'Triangular (1+2+...+d)';

  constructor() {
    Object.freeze(this);
  }

  costForDistance(distance: bigint): bigint {
    requireNonNegativeDistance(distance);
    return (distance * (distance + 1n)) / 2n;
  }
}

export const LINEAR_FUEL_MODEL = new LinearFuelModel();
export const TRIANGULAR_FUEL_MODEL = new TriangularFuelModel();
