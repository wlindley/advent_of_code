import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { FUEL_CHEMICAL, ORE_CHEMICAL, type ReactionNetwork } from './models';
import { ChemicalDemand, FuelSearchStep, findMaxFuelForOre } from './stoichiometry';

export const DEFAULT_MAX_TRACE_FRAMES = 80;

/** Snapshot of one chemical-resolution step in a top-down stoichiometry pass. */
export interface DemandTraceFrame {
  readonly kind: 'demand';
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly activeChemical: string | null;
  readonly activeDemand: ChemicalDemand | null;
  readonly cumulativeOre: bigint;
  readonly processedCount: number;
  readonly totalReactions: number;
  readonly knownNeeds: ReadonlyMap<string, bigint>;
  readonly resolvedDemands: ReadonlyMap<string, ChemicalDemand>;
}

/** Snapshot of one bracketing or binary-search step maximizing producible FUEL. */
export interface SearchTraceFrame {
  readonly kind: 'search';
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly searchStep: FuelSearchStep;
  readonly bestFuel: bigint;
  readonly bestOre: bigint;
  readonly maxFuel: bigint;
  readonly oreBudget: bigint;
}

export type StoichiometryTraceFrame = DemandTraceFrame | SearchTraceFrame;

function createDemandFrame(
  stepIndex: number,
  totalReactions: number,
  activeDemand: ChemicalDemand | null,
  needed: ReadonlyMap<string, bigint>,
  resolved: ReadonlyMap<string, ChemicalDemand>,
): DemandTraceFrame {
  return Object.freeze({
    kind: 'demand',
    stepIndex,
    totalSteps: totalReactions,
    activeChemical: activeDemand === null ? null : activeDemand.chemical,
    activeDemand,
    cumulativeOre: needed.get(ORE_CHEMICAL)!,
    processedCount: stepIndex,
    totalReactions,
    knownNeeds: new Map(needed),
    resolvedDemands: new Map(resolved),
  });
}

function initDemandMap(network: ReactionNetwork, fuelAmount: bigint): Map<string, bigint> {
  const needed = new Map<string, bigint>([[ORE_CHEMICAL, 0n]]);
  for (const rxn of network.orderedReactions) {
    needed.set(rxn.output.chemical, 0n);
  }
  needed.set(FUEL_CHEMICAL, fuelAmount);
  return needed;
}

/** Builds a bounded trace of top-down chemical demand resolution for `fuelAmount` FUEL. */
export function buildDemandTrace(
  network: ReactionNetwork,
  fuelAmount: bigint,
  maxSteps: number | undefined,
): readonly DemandTraceFrame[] {
  if (fuelAmount <= 0n) {
    throw new RangeError(`fuelAmount must be positive, got ${fuelAmount}`);
  }
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_FRAMES);
  const totalReactions = network.orderedReactions.length;
  const sampled = new Set(sampleTraceIndices(totalReactions + 1, limit));
  const needed = initDemandMap(network, fuelAmount);
  const resolved = new Map<string, ChemicalDemand>();
  const frames: DemandTraceFrame[] = [];
  if (sampled.has(0)) {
    frames.push(createDemandFrame(0, totalReactions, null, needed, resolved));
  }
  for (let i = 0; i < totalReactions; i++) {
    const rxn = network.orderedReactions[i]!;
    const demand = new ChemicalDemand(rxn.output.chemical, needed.get(rxn.output.chemical)!, rxn.output.quantity);
    resolved.set(demand.chemical, demand);
    const batches = demand.batches;
    for (const input of rxn.inputs) {
      needed.set(input.chemical, needed.get(input.chemical)! + input.quantity * batches);
    }
    const step = i + 1;
    if (sampled.has(step)) {
      frames.push(createDemandFrame(step, totalReactions, demand, needed, resolved));
    }
  }
  return Object.freeze(frames);
}

/** Builds a bounded trace of FUEL search steps under `oreBudget`. */
export function buildFuelSearchTrace(
  network: ReactionNetwork,
  oreBudget: bigint,
  maxSteps: number | undefined,
): readonly SearchTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_FRAMES);
  const result = findMaxFuelForOre(network, oreBudget);
  const runningBest: Array<{ fuel: bigint; ore: bigint }> = [];
  let bestFuel = 0n;
  let bestOre = 0n;
  for (const step of result.steps) {
    if (step.fits) {
      bestFuel = step.candidateFuel;
      bestOre = step.oreRequired;
    }
    runningBest.push({ fuel: bestFuel, ore: bestOre });
  }
  const indices = sampleTraceIndices(result.steps.length, limit);
  const totalSteps = result.steps.length - 1;
  return Object.freeze(
    indices.map((idx) => {
      const searchStep = result.steps[idx]!;
      const best = runningBest[idx]!;
      return Object.freeze({
        kind: 'search',
        stepIndex: searchStep.stepIndex,
        totalSteps,
        searchStep,
        bestFuel: best.fuel,
        bestOre: best.ore,
        maxFuel: result.maxFuel,
        oreBudget,
      });
    }),
  );
}
