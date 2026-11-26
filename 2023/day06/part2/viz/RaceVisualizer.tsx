import type { VisualizerProps } from '../../../../shared/viz';
import { RaceParabolaVisualizer } from '../../shared/viz/RaceParabolaVisualizer';
import { solver } from '../domain';

export function RaceVisualizer({ rawInput }: VisualizerProps) {
  return <RaceParabolaVisualizer rawInput={rawInput} solver={solver} />;
}
