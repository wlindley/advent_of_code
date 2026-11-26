import type { VisualizerProps } from '../../../../shared/viz';
import { BasinVisualizer } from '../../shared/viz/BasinVisualizer';
import { solver } from '../domain';

/** Part 2 interactive visualizer showing the shortest Start -> End -> Start -> End trip. */
export function BasinPart2Visualizer({ rawInput }: VisualizerProps) {
  return <BasinVisualizer rawInput={rawInput} solver={solver} partLabel="Part 2 (S → E → S → E)" />;
}
