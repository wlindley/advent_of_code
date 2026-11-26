import type { VisualizerProps } from '../../../../shared/viz';
import { RopeBridgeVisualizer } from '../../shared/viz/RopeBridgeVisualizer';
import { solver } from '../domain';

/** Interactive 2-knot Rope Bridge visualizer for 2022 Day 9 Part 1. */
export function RopeBridgePart1Visualizer({ rawInput }: VisualizerProps) {
  return <RopeBridgeVisualizer rawInput={rawInput} solver={solver} />;
}
