import type { VisualizerProps } from '../../../../shared/viz';
import { CrtTimelineVisualizer } from '../../shared/viz/CrtTimelineVisualizer';
import { STANDARD_PROBE_CYCLES, solver } from '../domain';

/** Interactive oscilloscope and signal-probe visualizer for 2022 Day 10 Part 1. */
export function CathodeRayTubePart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <CrtTimelineVisualizer
      rawInput={rawInput}
      solver={solver}
      probeCycles={STANDARD_PROBE_CYCLES}
      showProbes
    />
  );
}
