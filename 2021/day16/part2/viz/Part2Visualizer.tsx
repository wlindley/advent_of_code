import type { VisualizerProps } from '../../../../shared/viz';
import { PacketVisualizer } from '../../shared/viz/PacketVisualizer';
import { solver } from '../domain';

/** Part 2 interactive BITS packet decoder and expression-tree evaluator visualizer. */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <PacketVisualizer rawInput={rawInput} solver={solver} />;
}
