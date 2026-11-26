import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  type DropletTraceFrame,
  parseDroplet,
  traceTotalSurface,
  type VoxelDroplet,
} from '../../shared';

/** Pure TypeScript Part 1 solver computing total exposed surface area of 3D lava voxels. */
export const solver: PuzzleSolver<VoxelDroplet, number, DropletTraceFrame> = {
  parse: parseDroplet,
  solve(droplet: VoxelDroplet): number {
    return droplet.totalSurfaceArea;
  },
  trace(droplet: VoxelDroplet, options?: TraceOptions): readonly DropletTraceFrame[] {
    return traceTotalSurface(droplet, options);
  },
};
