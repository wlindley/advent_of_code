import type { VisualizerProps } from '../../../../shared/viz';
import { ReactorVisualizer } from '../../shared/viz/ReactorVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 22 Part 1. */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <ReactorVisualizer rawInput={rawInput} solver={solver} />;
}
