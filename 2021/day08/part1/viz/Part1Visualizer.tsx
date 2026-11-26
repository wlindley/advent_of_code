import type { VisualizerProps } from '../../../../shared/viz';
import { SevenSegmentVisualizer } from '../../shared/viz/SevenSegmentVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 8 Part 1 (unique-segment output digit counting). */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <SevenSegmentVisualizer rawInput={rawInput} solver={solver} />;
}
