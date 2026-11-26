import type { VisualizerProps } from '../../../../shared/viz';
import { CLUMSY_CRUCIBLE_RULE } from '../../shared';
import { CrucibleVisualizer } from '../../shared/viz/CrucibleVisualizer';
import { solver } from '../domain';

/** Interactive wavefront visualizer for AoC 2023 Day 17 Part 1. */
export function CruciblePart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <CrucibleVisualizer
      rawInput={rawInput}
      solver={solver}
      rule={CLUMSY_CRUCIBLE_RULE}
      partLabel="Part 1 (1–3 blocks)"
    />
  );
}
