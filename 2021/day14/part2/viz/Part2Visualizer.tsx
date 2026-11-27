import type { VisualizerProps } from '../../../../shared/viz';
import { PolymerizationVisualizer } from '../../shared/viz/PolymerizationVisualizer';
import { solver } from '../domain';

/** Part 2 interactive Extended Polymerization visualizer. */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <PolymerizationVisualizer rawInput={rawInput} solver={solver} />;
}
