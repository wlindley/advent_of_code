import type { VisualizerProps } from '../../../../shared/viz';
import { ExpenseRepairVisualizer } from '../../shared/viz/ExpenseRepairVisualizer';

export function ExpenseRepairPart2Visualizer({ rawInput }: VisualizerProps) {
  return <ExpenseRepairVisualizer rawInput={rawInput} tupleSize={3} />;
}
