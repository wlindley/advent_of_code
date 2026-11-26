import type { VisualizerProps } from '../../../../shared/viz';
import { XmasSignalVisualizer } from '../../shared/viz/XmasSignalVisualizer';
import { solver } from '../domain';

/** Part 2 interactive two-phase visualizer for XMAS contiguous encryption weakness search. */
export function EncodingErrorPart2Visualizer({ rawInput }: VisualizerProps) {
  return <XmasSignalVisualizer rawInput={rawInput} solver={solver} />;
}
