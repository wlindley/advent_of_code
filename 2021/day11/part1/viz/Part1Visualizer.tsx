import type { VisualizerProps } from '../../../../shared/viz';
import { OctopusVisualizer } from '../../shared/viz/OctopusVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 11 Part 1 (Dumbo Octopus — 100-step total flashes). */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <OctopusVisualizer rawInput={rawInput} solver={solver} />;
}
