import type { VisualizerProps } from '../../../../shared/viz';
import { GardenGroupsVisualizer } from '../../shared/viz/GardenGroupsVisualizer';
import { PERIMETER_METRIC, solver } from '../domain';

/** Part 1 visualizer displaying garden regions and perimeter fence boundaries. */
export function GardenGroupsPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <GardenGroupsVisualizer
      rawInput={rawInput}
      solver={solver}
      metric={PERIMETER_METRIC}
    />
  );
}
