import type { VisualizerProps } from '../../../../shared/viz';
import { solver } from '../domain';
import { GhostConvergenceVisualizer } from './GhostConvergenceVisualizer';

export function Visualizer({ rawInput }: VisualizerProps) {
  return <GhostConvergenceVisualizer rawInput={rawInput} solver={solver} />;
}
