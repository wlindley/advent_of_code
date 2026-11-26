import type { VisualizerProps } from '../../../../shared/viz';
import { SevenSegmentVisualizer } from '../../shared/viz/SevenSegmentVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 8 Part 2 (full decoded 4-digit output sum). */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <SevenSegmentVisualizer rawInput={rawInput} solver={solver} />;
}
