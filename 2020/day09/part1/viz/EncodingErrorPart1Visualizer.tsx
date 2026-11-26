import type { VisualizerProps } from '../../../../shared/viz';
import { XmasSignalVisualizer } from '../../shared/viz/XmasSignalVisualizer';
import { solver } from '../domain';

/** Part 1 interactive sliding-window visualizer for XMAS encoding error detection. */
export function EncodingErrorPart1Visualizer({ rawInput }: VisualizerProps) {
  return <XmasSignalVisualizer rawInput={rawInput} solver={solver} />;
}
