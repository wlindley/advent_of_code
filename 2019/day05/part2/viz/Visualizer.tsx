import type { VisualizerProps } from '../../../../shared/viz';
import { THERMAL_RADIATOR_SYSTEM_ID } from '../../shared';
import { DiagnosticVisualizer } from '../../shared/viz/DiagnosticVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 5 Part 2 interactive TEST diagnostic Intcode visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return (
    <DiagnosticVisualizer
      rawInput={rawInput}
      systemId={THERMAL_RADIATOR_SYSTEM_ID}
      solver={solver}
    />
  );
}
