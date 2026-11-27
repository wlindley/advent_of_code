import type { VisualizerProps } from '../../../../shared/viz';
import { OperationOrderVisualizer } from '../../shared/viz/OperationOrderVisualizer';
import { solver } from '../domain';

/** Part 1 interactive Operation Order AST evaluation visualizer. */
export function OperationOrderPart1Visualizer({ rawInput }: VisualizerProps) {
  return <OperationOrderVisualizer rawInput={rawInput} solver={solver} />;
}
