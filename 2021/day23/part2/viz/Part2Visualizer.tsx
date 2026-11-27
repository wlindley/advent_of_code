import type { VisualizerProps } from '../../../../shared/viz';
import { solver } from '../domain';
import { BurrowVisualizer } from '../../shared/viz/BurrowVisualizer';

/** Interactive visualizer for 2021 Day 23 Part 2. */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <BurrowVisualizer rawInput={rawInput} solver={solver} />;
}
