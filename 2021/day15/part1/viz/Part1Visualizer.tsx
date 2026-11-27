import type { VisualizerProps } from '../../../../shared/viz';
import { CavernVisualizer } from '../../shared/viz/CavernVisualizer';
import { solver } from '../domain';

/** Part 1 interactive Chiton lowest-risk path visualizer. */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <CavernVisualizer rawInput={rawInput} solver={solver} />;
}
