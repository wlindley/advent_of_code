import type { VisualizerProps } from '../../../../shared/viz';
import { MonsterMessagesVisualizer } from '../../shared/viz/MonsterMessagesVisualizer';
import { solver } from '../domain';

/** Part 1 interactive Monster Messages CYK parse visualizer. */
export function MonsterMessagesPart1Visualizer({ rawInput }: VisualizerProps) {
  return <MonsterMessagesVisualizer rawInput={rawInput} solver={solver} />;
}
