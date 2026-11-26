import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import { sumExpandedPairwiseDistances, validateExpansionFactor } from './expansion';
import { buildCosmicExpansionTrace, type CosmicExpansionTraceFrame } from './trace';
import { parseUniverseMap, type UniverseMap } from './universe';

/** Creates an immutable `PuzzleSolver` parameterized by a validated cosmic expansion factor. */
export function createCosmicExpansionSolver(
  expansionFactor: bigint,
): PuzzleSolver<UniverseMap, bigint, CosmicExpansionTraceFrame> {
  const factor = validateExpansionFactor(expansionFactor);
  return Object.freeze({
    parse: parseUniverseMap,
    solve: (universe: UniverseMap) => sumExpandedPairwiseDistances(universe, factor),
    trace: (universe: UniverseMap, options?: TraceOptions) =>
      buildCosmicExpansionTrace(universe, factor, options),
  });
}
