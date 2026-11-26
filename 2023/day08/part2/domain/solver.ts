import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseWastelandNetwork, type WastelandNetwork } from '../../shared';
import { solveHauntedWastelandPart2 } from './convergence';
import { GhostConvergenceFrame, traceHauntedWastelandPart2 } from './trace';

export const solver: PuzzleSolver<WastelandNetwork, bigint, GhostConvergenceFrame> = Object.freeze({
  parse(raw: string): WastelandNetwork {
    return parseWastelandNetwork(raw);
  },

  solve(network: WastelandNetwork): bigint {
    return solveHauntedWastelandPart2(network);
  },

  trace(network: WastelandNetwork, options?: TraceOptions): readonly GhostConvergenceFrame[] {
    return traceHauntedWastelandPart2(network, options);
  },
});
