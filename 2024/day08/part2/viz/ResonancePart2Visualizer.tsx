import type { VisualizerProps } from '../../../../shared/viz';
import { ResonanceVisualizer } from '../../shared/viz/ResonanceVisualizer';
import { HARMONIC_LINE_RULE } from '../domain';

/** Part 2 visualizer binding the resonant-harmonic collinear lattice rule. */
export function ResonancePart2Visualizer({ rawInput }: VisualizerProps) {
  return <ResonanceVisualizer rawInput={rawInput} rule={HARMONIC_LINE_RULE} />;
}
