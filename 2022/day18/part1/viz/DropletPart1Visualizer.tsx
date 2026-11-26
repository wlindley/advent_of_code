import type { VisualizerProps } from '../../../../shared/viz';
import { DropletVisualizer } from '../../shared/viz/DropletVisualizer';
import { solver } from '../domain';

/** Part 1 visualizer showing total exposed voxel surface area across Z slices. */
export function DropletPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <DropletVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (Total Surface)"
    />
  );
}
