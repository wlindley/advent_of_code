import type { VisualizerProps } from '../../../../shared/viz';
import { LinenVisualizer } from '../../shared/viz/LinenVisualizer';

/** Interactive Part 2 visualizer highlighting per-design and cumulative BigInt arrangements. */
export function LinenPart2Visualizer({ rawInput }: VisualizerProps) {
  return <LinenVisualizer rawInput={rawInput} mode="arrangements" />;
}
