import type { ReactionNetwork } from './models';
import { findMaxFuelForOre, oreRequiredForFuel } from './stoichiometry';
import {
  buildDemandTrace,
  buildFuelSearchTrace,
  type DemandTraceFrame,
  type SearchTraceFrame,
  type StoichiometryTraceFrame,
} from './trace';

export const TRILLION_ORE = 1_000_000_000_000n;

/** Policy parameterizing stoichiometry solving and trace generation per puzzle part. */
export interface StoichiometryPolicy<
  TAnswer,
  TTrace extends StoichiometryTraceFrame = StoichiometryTraceFrame,
> {
  readonly id: string;
  readonly label: string;
  solve(network: ReactionNetwork): TAnswer;
  trace(network: ReactionNetwork, maxSteps: number | undefined): readonly TTrace[];
  formatFrameAnswer(frame: TTrace): string;
}

/** Creates a policy computing minimum ORE required for `fuelAmount` FUEL. */
export function createOreForFuelPolicy(
  fuelAmount: bigint,
): StoichiometryPolicy<bigint, DemandTraceFrame> {
  if (fuelAmount <= 0n) {
    throw new RangeError(`fuelAmount must be positive, got ${fuelAmount}`);
  }
  const policy: StoichiometryPolicy<bigint, DemandTraceFrame> = {
    id: `ore-for-${fuelAmount}-fuel`,
    label: `ORE for ${fuelAmount} FUEL`,
    solve: (network) => oreRequiredForFuel(network, fuelAmount),
    trace: (network, maxSteps) => buildDemandTrace(network, fuelAmount, maxSteps),
    formatFrameAnswer: (frame) => String(frame.cumulativeOre),
  };
  return Object.freeze(policy);
}

export const ORE_FOR_ONE_FUEL_POLICY = createOreForFuelPolicy(1n);

/** Creates a policy maximizing FUEL producible within `oreBudget`. */
export function createMaxFuelPolicy(
  oreBudget: bigint,
): StoichiometryPolicy<bigint, SearchTraceFrame> {
  if (oreBudget < 0n) {
    throw new RangeError(`oreBudget must be non-negative, got ${oreBudget}`);
  }
  const policy: StoichiometryPolicy<bigint, SearchTraceFrame> = {
    id: `max-fuel-for-${oreBudget}`,
    label: `Max FUEL for ${oreBudget} ORE`,
    solve: (network) => findMaxFuelForOre(network, oreBudget).maxFuel,
    trace: (network, maxSteps) => buildFuelSearchTrace(network, oreBudget, maxSteps),
    formatFrameAnswer: (frame) => String(frame.bestFuel),
  };
  return Object.freeze(policy);
}

export const MAX_FUEL_FOR_TRILLION_ORE_POLICY = createMaxFuelPolicy(TRILLION_ORE);
