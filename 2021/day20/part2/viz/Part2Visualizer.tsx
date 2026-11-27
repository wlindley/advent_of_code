import type { VisualizerProps } from '../../../../shared/viz';
import { TrenchMapVisualizer } from '../../shared/viz/TrenchMapVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 20 Part 2. */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <TrenchMapVisualizer rawInput={rawInput} solver={solver} />;
}
