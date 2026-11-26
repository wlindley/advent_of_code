import type { VisualizerProps } from '../../../../shared/viz';
import { CamelCardsVisualizer } from '../../shared/viz/CamelCardsVisualizer';
import { solver } from '../domain';

export function Visualizer({ rawInput }: VisualizerProps) {
  return <CamelCardsVisualizer rawInput={rawInput} solver={solver} />;
}
