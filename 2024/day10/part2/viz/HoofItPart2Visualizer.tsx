import type { VisualizerProps } from '../../../../shared/viz';
import { TopographicVisualizer } from '../../shared/viz/TopographicVisualizer';
import { solver } from '../domain';

/** Part 2 visualizer displaying trailhead basins and distinct trail multiplicities per 9-peak. */
export function HoofItPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <TopographicVisualizer
      rawInput={rawInput}
      solver={solver}
      mode="rating"
      metricLabel="Rating"
      metricUnit="trails"
    />
  );
}
