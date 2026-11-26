import type { VisualizerProps } from '../../../../shared/viz';
import { ReservoirVisualizer } from '../../shared/viz/ReservoirVisualizer';
import { ABYSS_BOUNDARY_POLICY, solver } from '../domain';

/** Part 1 wrapper rendering cave cross-section sand pouring under abyss escape rules. */
export function RegolithPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <ReservoirVisualizer
      rawInput={rawInput}
      policy={ABYSS_BOUNDARY_POLICY}
      solver={solver}
    />
  );
}
