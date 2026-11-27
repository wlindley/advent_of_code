import type { VisualizerProps } from '../../../../shared/viz';
import { CavernVisualizer } from '../../shared/viz/CavernVisualizer';
import { solver } from '../domain';

/** Part 2 interactive Chiton 5x5 tiled lowest-risk path visualizer. */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <CavernVisualizer rawInput={rawInput} solver={solver} />;
}
