import type { VisualizerProps } from '../../../../shared/viz';
import { PulseCircuitVisualizer } from '../../shared/viz/PulseCircuitVisualizer';
import { solver } from '../domain';

/** Interactive pulse propagation visualizer for AoC 2023 Day 20 Part 2. */
export function PulsePart2Visualizer({ rawInput }: VisualizerProps) {
  return (
    <PulseCircuitVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 2 (Low Pulse to rx)"
    />
  );
}
