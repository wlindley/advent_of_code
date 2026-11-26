import type { VisualizerProps } from '../../../../shared/viz';
import { ReservoirVisualizer } from '../../shared/viz/ReservoirVisualizer';
import { FLOOR_BOUNDARY_POLICY, solver } from '../domain';

/** Part 2 wrapper rendering cave cross-section sand pouring onto a bedrock floor. */
export function RegolithPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <ReservoirVisualizer
      rawInput={rawInput}
      policy={FLOOR_BOUNDARY_POLICY}
      solver={solver}
    />
  );
}
