import type { VisualizerProps } from '../../../../shared/viz';
import { PolymerizationVisualizer } from '../../shared/viz/PolymerizationVisualizer';
import { solver } from '../domain';

/** Part 1 interactive Extended Polymerization visualizer. */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <PolymerizationVisualizer rawInput={rawInput} solver={solver} />;
}
