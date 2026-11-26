import type { VisualizerProps } from '../../../../shared/viz';
import { EXACT_PAIR_POLICY } from '../../shared';
import { SecureContainerVisualizer } from '../../shared/viz/SecureContainerVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 4 Part 2 interactive Secure Container odometer visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return (
    <SecureContainerVisualizer
      rawInput={rawInput}
      policy={EXACT_PAIR_POLICY}
      solver={solver}
    />
  );
}
