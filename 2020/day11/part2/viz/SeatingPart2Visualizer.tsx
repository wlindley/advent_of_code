import type { VisualizerProps } from '../../../../shared/viz';
import { SeatingVisualizer } from '../../shared/viz/SeatingVisualizer';
import { solver } from '../domain';

/** Interactive Part 2 seating visualizer configured for 8-direction line-of-sight rules. */
export function SeatingPart2Visualizer({ rawInput }: VisualizerProps) {
  return <SeatingVisualizer rawInput={rawInput} solver={solver} />;
}
