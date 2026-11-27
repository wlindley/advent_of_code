import type { VisualizerProps } from '../../../../shared/viz';
import { SnailfishVisualizer } from '../../shared/viz/SnailfishVisualizer';
import { solver } from '../domain';

/** Part 1 interactive sequential snailfish addition and reduction visualizer. */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <SnailfishVisualizer rawInput={rawInput} solver={solver} />;
}
