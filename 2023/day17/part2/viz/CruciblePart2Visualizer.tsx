import type { VisualizerProps } from '../../../../shared/viz';
import { ULTRA_CRUCIBLE_RULE } from '../../shared';
import { CrucibleVisualizer } from '../../shared/viz/CrucibleVisualizer';
import { solver } from '../domain';

/** Interactive wavefront visualizer for AoC 2023 Day 17 Part 2. */
export function CruciblePart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <CrucibleVisualizer
      rawInput={rawInput}
      solver={solver}
      rule={ULTRA_CRUCIBLE_RULE}
      partLabel="Part 2 (4–10 blocks)"
    />
  );
}
