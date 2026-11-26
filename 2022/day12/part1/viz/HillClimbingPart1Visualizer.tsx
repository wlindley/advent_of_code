import type { VisualizerProps } from '../../../../shared/viz';
import { HillClimbingVisualizer } from '../../shared/viz/HillClimbingVisualizer';
import { FIXED_START_CONDITION, solver } from '../domain';

/** Part 1 wrapper rendering reverse-BFS shortest-path wavefront from `E` to `S`. */
export function HillClimbingPart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <HillClimbingVisualizer
      rawInput={rawInput}
      solver={solver}
      condition={FIXED_START_CONDITION}
    />
  );
}
