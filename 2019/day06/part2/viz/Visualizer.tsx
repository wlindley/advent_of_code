import type { VisualizerProps } from '../../../../shared/viz';
import { SANTA_TRANSFER_POLICY } from '../../shared';
import { OrbitMapVisualizer } from '../../shared/viz/OrbitMapVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 6 Part 2 interactive orbital-transfer visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <OrbitMapVisualizer rawInput={rawInput} policy={SANTA_TRANSFER_POLICY} solver={solver} />;
}
