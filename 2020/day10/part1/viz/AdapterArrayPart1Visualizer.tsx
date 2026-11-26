import type { VisualizerProps } from '../../../../shared/viz';
import { AdapterChainVisualizer } from '../../shared/viz/AdapterChainVisualizer';
import { solver } from '../domain';

/** Part 1 interactive adapter-chain staircase and jolt-difference visualizer. */
export function AdapterArrayPart1Visualizer({ rawInput }: VisualizerProps) {
  return <AdapterChainVisualizer rawInput={rawInput} solver={solver} />;
}
