import type { VisualizerProps } from '../../../../shared/viz';
import { TicketVisualizer } from '../../shared/viz/TicketVisualizer';
import { solver } from '../domain';

/** Interactive Part 1 interval-spectrum ticket scanning visualizer. */
export function TicketPart1Visualizer({ rawInput }: VisualizerProps) {
  return <TicketVisualizer rawInput={rawInput} solver={solver} />;
}
