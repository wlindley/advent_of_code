import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type DropletTraceFrame,
  ExteriorFlood,
  parseDroplet,
  traceExteriorSurface,
  type VoxelDroplet,
} from '../../shared';

/** Pure TypeScript Part 2 solver computing exterior-reachable surface area via 3D flood fill. */
export const solver: PuzzleSolver<VoxelDroplet, number, DropletTraceFrame> = {
  parse: parseDroplet,
  solve(droplet: VoxelDroplet): number {
    return ExteriorFlood.compute(droplet).exteriorSurfaceArea;
  },
  trace(droplet: VoxelDroplet, options?: TraceOptions): readonly DropletTraceFrame[] {
    return traceExteriorSurface(droplet, options);
  },
};
