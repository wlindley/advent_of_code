import type { VisualizerProps } from '../../../../shared/viz';
import { SmokeBasinVisualizer } from '../../shared/viz/SmokeBasinVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 9 Part 1 (Smoke Basin low-point risk sum). */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <SmokeBasinVisualizer rawInput={rawInput} solver={solver} />;
}
