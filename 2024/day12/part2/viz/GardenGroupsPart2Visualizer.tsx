import type { VisualizerProps } from '../../../../shared/viz';
import { GardenGroupsVisualizer } from '../../shared/viz/GardenGroupsVisualizer';
import { SIDES_METRIC, solver } from '../domain';

/** Part 2 visualizer displaying garden regions and straight-side counts. */
export function GardenGroupsPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <GardenGroupsVisualizer
      rawInput={rawInput}
      solver={solver}
      metric={SIDES_METRIC}
    />
  );
}
