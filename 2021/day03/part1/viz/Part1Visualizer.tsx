import type { VisualizerProps } from '../../../../shared/viz';
import { PowerDiagnosticVisualizer } from '../../shared/viz/PowerDiagnosticVisualizer';
import { solver } from '../domain';

/** Interactive visualizer for 2021 Day 3 Part 1 (gamma/epsilon power diagnostics). */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <PowerDiagnosticVisualizer rawInput={rawInput} solver={solver} />;
}
