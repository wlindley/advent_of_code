import type { VisualizerProps } from '../../../../shared/viz';
import { solver } from '../domain';
import { BurrowVisualizer } from '../../shared/viz/BurrowVisualizer';

/** Interactive visualizer for 2021 Day 23 Part 1. */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <BurrowVisualizer rawInput={rawInput} solver={solver} />;
}
