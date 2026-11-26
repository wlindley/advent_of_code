import type { VisualizerProps } from '../../../../shared/viz';
import { SonarSweepVisualizer } from '../../shared/viz/SonarSweepVisualizer';
import { PART1_WINDOW_SIZE, solver } from '../domain';

/** Interactive visualizer for 2021 Day 1 Part 1 (stride W = 1). */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <SonarSweepVisualizer rawInput={rawInput} solver={solver} windowSize={PART1_WINDOW_SIZE} />;
}
