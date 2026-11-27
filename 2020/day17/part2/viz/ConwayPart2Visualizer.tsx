import type { VisualizerProps } from '../../../../shared/viz';
import { ConwayCubesVisualizer } from '../../shared/viz/ConwayCubesVisualizer';
import { solver } from '../domain';

/** Part 2 interactive 4D Conway Cubes visualizer. */
export function ConwayPart2Visualizer({ rawInput }: VisualizerProps) {
  return <ConwayCubesVisualizer rawInput={rawInput} solver={solver} />;
}
