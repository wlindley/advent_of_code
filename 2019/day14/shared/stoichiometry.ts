import { ceilDiv } from '../../../shared/core';
import { FUEL_CHEMICAL, ORE_CHEMICAL, type ReactionNetwork } from './models';

/** Immutable demand and batch breakdown for one chemical in a stoichiometry pass. */
export class ChemicalDemand {
  readonly chemical: string;
  readonly needed: bigint;
  readonly batchSize: bigint;

  constructor(chemical: string, needed: bigint, batchSize: bigint) {
    if (needed <= 0n) {
      throw new RangeError(`ChemicalDemand needed must be positive, got ${needed}`);
    }
    if (batchSize <= 0n) {
      throw new RangeError(`ChemicalDemand batchSize must be positive, got ${batchSize}`);
    }
    this.chemical = chemical;
    this.needed = needed;
    this.batchSize = batchSize;
    Object.freeze(this);
  }

  get batches(): bigint {
    return ceilDiv(this.needed, this.batchSize);
  }

  get produced(): bigint {
    return this.batches * this.batchSize;
  }

  get leftover(): bigint {
    return this.produced - this.needed;
  }
}

/** Complete single-pass stoichiometry result for a target FUEL quantity. */
export interface StoichiometryEvaluation {
  readonly fuelTarget: bigint;
  readonly oreRequired: bigint;
  readonly demands: readonly ChemicalDemand[];
}

export type FuelSearchPhase = 'bracket' | 'binary';

/** Immutable snapshot of one exponential-bracket or binary-search evaluation step. */
export class FuelSearchStep {
  readonly stepIndex: number;
  readonly phase: FuelSearchPhase;
  readonly low: bigint;
  readonly high: bigint;
  readonly candidateFuel: bigint;
  readonly oreRequired: bigint;
  readonly oreBudget: bigint;

  constructor(
    stepIndex: number,
    phase: FuelSearchPhase,
    low: bigint,
    high: bigint,
    candidateFuel: bigint,
    oreRequired: bigint,
    oreBudget: bigint,
  ) {
    this.stepIndex = stepIndex;
    this.phase = phase;
    this.low = low;
    this.high = high;
    this.candidateFuel = candidateFuel;
    this.oreRequired = oreRequired;
    this.oreBudget = oreBudget;
    Object.freeze(this);
  }

  get fits(): boolean {
    return this.oreRequired <= this.oreBudget;
  }
}

/** Result of maximizing producible FUEL within a fixed ORE budget. */
export interface FuelSearchResult {
  readonly oreBudget: bigint;
  readonly maxFuel: bigint;
  readonly oreUsed: bigint;
  readonly steps: readonly FuelSearchStep[];
}

/** Evaluates exact ORE and per-chemical reaction batches required for `fuelAmount` FUEL. */
export function evaluateStoichiometry(
  network: ReactionNetwork,
  fuelAmount: bigint,
): StoichiometryEvaluation {
  if (fuelAmount <= 0n) {
    throw new RangeError(`fuelAmount must be positive, got ${fuelAmount}`);
  }
  const needed = new Map<string, bigint>([[ORE_CHEMICAL, 0n]]);
  for (const rxn of network.orderedReactions) {
    needed.set(rxn.output.chemical, 0n);
  }
  needed.set(FUEL_CHEMICAL, fuelAmount);

  const demands: ChemicalDemand[] = [];
  for (const rxn of network.orderedReactions) {
    const req = needed.get(rxn.output.chemical)!;
    const demand = new ChemicalDemand(rxn.output.chemical, req, rxn.output.quantity);
    demands.push(demand);
    const batches = demand.batches;
    for (const input of rxn.inputs) {
      needed.set(input.chemical, needed.get(input.chemical)! + input.quantity * batches);
    }
  }

  return Object.freeze({
    fuelTarget: fuelAmount,
    oreRequired: needed.get(ORE_CHEMICAL)!,
    demands: Object.freeze(demands),
  });
}

/** Returns exact ORE required to produce `fuelAmount` FUEL. */
export function oreRequiredForFuel(network: ReactionNetwork, fuelAmount: bigint): bigint {
  return evaluateStoichiometry(network, fuelAmount).oreRequired;
}

function bracketFuelRange(
  network: ReactionNetwork,
  oreBudget: bigint,
  steps: FuelSearchStep[],
): { low: bigint; high: bigint; bestOre: bigint } {
  let low = 0n;
  let high = 1n;
  let bestOre = 0n;
  let ore = oreRequiredForFuel(network, high);
  steps.push(new FuelSearchStep(steps.length, 'bracket', low, high, high, ore, oreBudget));
  while (ore <= oreBudget) {
    low = high;
    bestOre = ore;
    high *= 2n;
    ore = oreRequiredForFuel(network, high);
    steps.push(new FuelSearchStep(steps.length, 'bracket', low, high, high, ore, oreBudget));
  }
  return { low, high, bestOre };
}

/** Finds maximum integer FUEL producible within `oreBudget` via bracketing + binary search. */
export function findMaxFuelForOre(network: ReactionNetwork, oreBudget: bigint): FuelSearchResult {
  if (oreBudget < 0n) {
    throw new RangeError(`oreBudget must be non-negative, got ${oreBudget}`);
  }
  const steps: FuelSearchStep[] = [];
  let { low, high, bestOre } = bracketFuelRange(network, oreBudget, steps);
  while (low + 1n < high) {
    const mid = (low + high) >> 1n;
    const midOre = oreRequiredForFuel(network, mid);
    steps.push(new FuelSearchStep(steps.length, 'binary', low, high, mid, midOre, oreBudget));
    if (midOre <= oreBudget) {
      low = mid;
      bestOre = midOre;
    } else {
      high = mid;
    }
  }
  return Object.freeze({ oreBudget, maxFuel: low, oreUsed: bestOre, steps: Object.freeze(steps) });
}
