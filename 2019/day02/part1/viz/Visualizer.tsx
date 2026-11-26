import type { VisualizerProps } from '../../../../shared/viz';
import { ALARM_1202_INPUTS } from '../../shared';
import { IntcodeTapeVisualizer } from '../../shared/viz/IntcodeTapeVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 2 Part 1 interactive Intcode memory-tape visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <IntcodeTapeVisualizer rawInput={rawInput} inputs={ALARM_1202_INPUTS} solver={solver} />;
}
