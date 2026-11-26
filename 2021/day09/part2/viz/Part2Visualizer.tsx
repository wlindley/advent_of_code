import type { VisualizerProps } from '../../../../shared/viz';
import { SmokeBasinVisualizer } from '../../shared/viz/SmokeBasinVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 9 Part 2 (Smoke Basin largest-basins product). */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <SmokeBasinVisualizer rawInput={rawInput} solver={solver} />;
}
