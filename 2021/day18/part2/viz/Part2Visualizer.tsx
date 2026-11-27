import type { VisualizerProps } from '../../../../shared/viz';
import { SnailfishVisualizer } from '../../shared/viz/SnailfishVisualizer';
import { solver } from '../domain';

/** Part 2 interactive winning-pair snailfish addition and reduction visualizer. */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <SnailfishVisualizer rawInput={rawInput} solver={solver} />;
}
