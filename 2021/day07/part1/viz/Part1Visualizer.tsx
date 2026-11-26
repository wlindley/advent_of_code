import type { VisualizerProps } from '../../../../shared/viz';
import { CrabAlignmentVisualizer } from '../../shared/viz/CrabAlignmentVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 7 Part 1 (linear-fuel crab alignment). */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <CrabAlignmentVisualizer rawInput={rawInput} solver={solver} />;
}
