import type { VisualizerProps } from '../../../../shared/viz';
import { PART1_SLOPES } from '../../shared';
import { TobogganTrajectoryVisualizer } from '../../shared/viz/TobogganTrajectoryVisualizer';

export function TobogganPart1Visualizer({ rawInput }: VisualizerProps) {
  return <TobogganTrajectoryVisualizer rawInput={rawInput} slopes={PART1_SLOPES} />;
}
