import type { VisualizerProps } from '../../../../shared/viz';
import { SonarSweepVisualizer } from '../../shared/viz/SonarSweepVisualizer';
import { PART2_WINDOW_SIZE, solver } from '../domain';

/** Interactive visualizer for 2021 Day 1 Part 2 (stride W = 3). */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <SonarSweepVisualizer rawInput={rawInput} solver={solver} windowSize={PART2_WINDOW_SIZE} />;
}
