import type { VisualizerProps } from '../../../../shared/viz';
import { PacketVisualizer } from '../../shared/viz/PacketVisualizer';
import { solver } from '../domain';

/** Part 1 interactive BITS packet decoder and version-sum visualizer. */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <PacketVisualizer rawInput={rawInput} solver={solver} />;
}
