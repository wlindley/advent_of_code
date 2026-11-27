import type { VisualizerProps } from '../../../../shared/viz';
import { SeatingVisualizer } from '../../shared/viz/SeatingVisualizer';
import { solver } from '../domain';

/** Interactive Part 1 seating visualizer configured for immediate 8-neighbor rules. */
export function SeatingPart1Visualizer({ rawInput }: VisualizerProps) {
  return <SeatingVisualizer rawInput={rawInput} solver={solver} />;
}
