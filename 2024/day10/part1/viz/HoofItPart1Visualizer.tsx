import type { VisualizerProps } from '../../../../shared/viz';
import { TopographicVisualizer } from '../../shared/viz/TopographicVisualizer';
import { solver } from '../domain';

/** Part 1 visualizer displaying trailhead basins and distinct reachable 9-peaks. */
export function HoofItPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <TopographicVisualizer
      rawInput={rawInput}
      solver={solver}
      mode="score"
      metricLabel="Score"
      metricUnit="peaks"
    />
  );
}
