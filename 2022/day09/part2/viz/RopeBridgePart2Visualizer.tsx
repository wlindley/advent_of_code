import type { VisualizerProps } from '../../../../shared/viz';
import { RopeBridgeVisualizer } from '../../shared/viz/RopeBridgeVisualizer';
import { solver } from '../domain';

/** Interactive 10-knot Rope Bridge visualizer for 2022 Day 9 Part 2. */
export function RopeBridgePart2Visualizer({ rawInput }: VisualizerProps) {
  return <RopeBridgeVisualizer rawInput={rawInput} solver={solver} />;
}
