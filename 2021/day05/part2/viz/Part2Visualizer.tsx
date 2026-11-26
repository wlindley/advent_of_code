import type { VisualizerProps } from '../../../../shared/viz';
import { OCTILINEAR_POLICY } from '../../shared';
import { VentFieldVisualizer } from '../../shared/viz/VentFieldVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 5 Part 2 (octilinear vent lines). */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <VentFieldVisualizer rawInput={rawInput} solver={solver} policy={OCTILINEAR_POLICY} />;
}
