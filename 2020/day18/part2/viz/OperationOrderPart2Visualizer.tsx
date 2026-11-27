import type { VisualizerProps } from '../../../../shared/viz';
import { OperationOrderVisualizer } from '../../shared/viz/OperationOrderVisualizer';
import { solver } from '../domain';

/** Part 2 interactive Operation Order AST evaluation visualizer. */
export function OperationOrderPart2Visualizer({ rawInput }: VisualizerProps) {
  return <OperationOrderVisualizer rawInput={rawInput} solver={solver} />;
}
