import type { VisualizerProps } from '../../../../shared/viz';
import { ConwayCubesVisualizer } from '../../shared/viz/ConwayCubesVisualizer';
import { solver } from '../domain';

/** Part 1 interactive 3D Conway Cubes visualizer. */
export function ConwayPart1Visualizer({ rawInput }: VisualizerProps) {
  return <ConwayCubesVisualizer rawInput={rawInput} solver={solver} />;
}
