import type { VisualizerProps } from '../../../../shared/viz';
import { SINGLE_STAGE_FUEL_POLICY } from '../../shared';
import { RocketFuelVisualizer } from '../../shared/viz/RocketFuelVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 1 Part 1 interactive visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <RocketFuelVisualizer rawInput={rawInput} policy={SINGLE_STAGE_FUEL_POLICY} solver={solver} />;
}
