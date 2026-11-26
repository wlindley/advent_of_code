import type { VisualizerProps } from '../../../../shared/viz';
import { AT_LEAST_PAIR_POLICY } from '../../shared';
import { SecureContainerVisualizer } from '../../shared/viz/SecureContainerVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 4 Part 1 interactive Secure Container odometer visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return (
    <SecureContainerVisualizer
      rawInput={rawInput}
      policy={AT_LEAST_PAIR_POLICY}
      solver={solver}
    />
  );
}
