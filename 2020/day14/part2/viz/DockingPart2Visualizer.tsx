import type { VisualizerProps } from '../../../../shared/viz';
import { DockingVisualizer } from '../../shared/viz/DockingVisualizer';
import { solver } from '../domain';

/** Interactive Part 2 36-bit floating-address decoder visualizer. */
export function DockingPart2Visualizer({ rawInput }: VisualizerProps) {
  return <DockingVisualizer rawInput={rawInput} solver={solver} />;
}
