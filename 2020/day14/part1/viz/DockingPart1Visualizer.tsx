import type { VisualizerProps } from '../../../../shared/viz';
import { DockingVisualizer } from '../../shared/viz/DockingVisualizer';
import { solver } from '../domain';

/** Interactive Part 1 36-bit value-masking decoder visualizer. */
export function DockingPart1Visualizer({ rawInput }: VisualizerProps) {
  return <DockingVisualizer rawInput={rawInput} solver={solver} />;
}
