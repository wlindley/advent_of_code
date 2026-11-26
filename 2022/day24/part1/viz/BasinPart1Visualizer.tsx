import type { VisualizerProps } from '../../../../shared/viz';
import { BasinVisualizer } from '../../shared/viz/BasinVisualizer';
import { solver } from '../domain';

/** Part 1 interactive visualizer showing the shortest Start -> End Blizzard Basin crossing. */
export function BasinPart1Visualizer({ rawInput }: VisualizerProps) {
  return <BasinVisualizer rawInput={rawInput} solver={solver} partLabel="Part 1 (S → E)" />;
}
