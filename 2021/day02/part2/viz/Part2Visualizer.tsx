import type { VisualizerProps } from '../../../../shared/viz';
import { AIM_NAVIGATION_POLICY } from '../../shared';
import { DiveTrajectoryVisualizer } from '../../shared/viz/DiveTrajectoryVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 2 Part 2 (aim-steered submarine navigation). */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <DiveTrajectoryVisualizer rawInput={rawInput} solver={solver} policy={AIM_NAVIGATION_POLICY} />;
}
