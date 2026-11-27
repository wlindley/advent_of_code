import type { VisualizerProps } from '../../../../shared/viz';
import { HullPainterVisualizer } from '../../shared/viz/HullPainterVisualizer';
import { solver } from '../domain';

/** AoC 2019 Day 11 Part 2 interactive hull-painting robot visualizer. */
export function Visualizer({ rawInput }: VisualizerProps) {
  return <HullPainterVisualizer rawInput={rawInput} solver={solver} />;
}
