import type { VisualizerProps } from '../../../../shared/viz';
import { OrigamiVisualizer } from '../../shared/viz/OrigamiVisualizer';
import { solver } from '../domain';

/** Part 1 interactive Transparent Origami visualizer. */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <OrigamiVisualizer rawInput={rawInput} solver={solver} />;
}
