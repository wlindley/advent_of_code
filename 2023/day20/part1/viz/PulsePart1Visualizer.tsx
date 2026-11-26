import type { VisualizerProps } from '../../../../shared/viz';
import { PulseCircuitVisualizer } from '../../shared/viz/PulseCircuitVisualizer';
import { solver } from '../domain';

/** Interactive pulse propagation visualizer for AoC 2023 Day 20 Part 1. */
export function PulsePart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <PulseCircuitVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 1 (1,000 Presses)"
    />
  );
}
