import type { VisualizerProps } from '../../../../shared/viz';
import { TOTAL_ORBITS_POLICY } from '../../shared';
import { OrbitMapVisualizer } from '../../shared/viz/OrbitMapVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 6 Part 1 interactive orbit-depth sweep visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <OrbitMapVisualizer rawInput={rawInput} policy={TOTAL_ORBITS_POLICY} solver={solver} />;
}
