import type { VisualizerProps } from '../../../../shared/viz';
import { FftVisualizer } from '../../shared/viz/FftVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for AoC 2019 Day 16 Part 2. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <FftVisualizer rawInput={rawInput} solver={solver} />;
}
