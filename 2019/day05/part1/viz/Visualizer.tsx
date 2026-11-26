import type { VisualizerProps } from '../../../../shared/viz';
import { AIR_CONDITIONER_SYSTEM_ID } from '../../shared';
import { DiagnosticVisualizer } from '../../shared/viz/DiagnosticVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 5 Part 1 interactive TEST diagnostic Intcode visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return (
    <DiagnosticVisualizer
      rawInput={rawInput}
      systemId={AIR_CONDITIONER_SYSTEM_ID}
      solver={solver}
    />
  );
}
