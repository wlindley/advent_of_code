import type { VisualizerProps } from '../../../../shared/viz';
import { AXIS_ALIGNED_POLICY } from '../../shared';
import { VentFieldVisualizer } from '../../shared/viz/VentFieldVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 5 Part 1 (axis-aligned vent lines). */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <VentFieldVisualizer rawInput={rawInput} solver={solver} policy={AXIS_ALIGNED_POLICY} />;
}
