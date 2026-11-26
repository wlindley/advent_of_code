import type { VisualizerProps } from '../../../../shared/viz';
import { WastelandVisualizer } from '../../shared/viz/WastelandVisualizer';
import { solver } from '../domain';

export function Visualizer({ rawInput }: VisualizerProps) {
  return <WastelandVisualizer rawInput={rawInput} solver={solver} />;
}
