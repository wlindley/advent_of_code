import type { VisualizerProps } from '../../../../shared/viz';
import { OctopusVisualizer } from '../../shared/viz/OctopusVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 11 Part 2 (Dumbo Octopus — first synchronized flash). */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <OctopusVisualizer rawInput={rawInput} solver={solver} />;
}
