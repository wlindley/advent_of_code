import type { VisualizerProps } from '../../../../shared/viz';
import { PART2_SLOPES } from '../../shared';
import { TobogganTrajectoryVisualizer } from '../../shared/viz/TobogganTrajectoryVisualizer';

export function TobogganPart2Visualizer({ rawInput }: VisualizerProps) {
  return <TobogganTrajectoryVisualizer rawInput={rawInput} slopes={PART2_SLOPES} />;
}
