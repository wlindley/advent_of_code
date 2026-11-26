import type { VisualizerProps } from '../../../../shared/viz';
import { LinenVisualizer } from '../../shared/viz/LinenVisualizer';

/** Interactive Part 1 visualizer highlighting possible-design count and witness/stall state. */
export function LinenPart1Visualizer({ rawInput }: VisualizerProps) {
  return <LinenVisualizer rawInput={rawInput} mode="possible" />;
}
