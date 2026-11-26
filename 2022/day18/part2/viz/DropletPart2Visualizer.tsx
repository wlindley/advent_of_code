import type { VisualizerProps } from '../../../../shared/viz';
import { DropletVisualizer } from '../../shared/viz/DropletVisualizer';
import { solver } from '../domain';

/** Part 2 visualizer showing exterior-reachable voxel surface area and trapped air pockets. */
export function DropletPart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <DropletVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 2 (Exterior Surface)"
    />
  );
}
