import type { VisualizerProps } from '../../../../shared/viz';
import { AdapterChainVisualizer } from '../../shared/viz/AdapterChainVisualizer';
import { solver } from '../domain';

/** Part 2 interactive adapter-chain staircase and arrangement-DP visualizer. */
export function AdapterArrayPart2Visualizer({ rawInput }: VisualizerProps) {
  return <AdapterChainVisualizer rawInput={rawInput} solver={solver} />;
}
