import type { VisualizerProps } from '../../../../shared/viz';
import { MonsterMessagesVisualizer } from '../../shared/viz/MonsterMessagesVisualizer';
import { solver } from '../domain';

/** Part 2 interactive Monster Messages CYK parse visualizer. */
export function MonsterMessagesPart2Visualizer({ rawInput }: VisualizerProps) {
  return <MonsterMessagesVisualizer rawInput={rawInput} solver={solver} />;
}
