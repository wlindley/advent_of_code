import type { VisualizerProps } from '../../../../shared/viz';
import { TicketVisualizer } from '../../shared/viz/TicketVisualizer';
import { solver } from '../domain';

/** Interactive Part 2 compatibility-matrix degree-1 peeling visualizer. */
export function TicketPart2Visualizer({ rawInput }: VisualizerProps) {
  return <TicketVisualizer rawInput={rawInput} solver={solver} />;
}
