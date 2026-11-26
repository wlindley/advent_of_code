import type { VisualizerProps } from '../../../../shared/viz';
import { DIRECT_NAVIGATION_POLICY } from '../../shared';
import { DiveTrajectoryVisualizer } from '../../shared/viz/DiveTrajectoryVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 2 Part 1 (direct horizontal/depth navigation). */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <DiveTrajectoryVisualizer rawInput={rawInput} solver={solver} policy={DIRECT_NAVIGATION_POLICY} />;
}
