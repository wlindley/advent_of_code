import type { VisualizerProps } from '../../../../shared/viz';
import { LanternfishVisualizer } from '../../shared/viz/LanternfishVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 6 Part 2 (256-day lanternfish simulation). */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <LanternfishVisualizer rawInput={rawInput} solver={solver} />;
}
