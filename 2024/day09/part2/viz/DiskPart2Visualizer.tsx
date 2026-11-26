import type { VisualizerProps } from '../../../../shared/viz';
import { DiskCompactionVisualizer } from '../../shared/viz/DiskCompactionVisualizer';
import { WHOLE_FILE_COMPACTION_STRATEGY } from '../domain';

/** Part 2 visualizer binding the whole-file compaction strategy. */
export function DiskPart2Visualizer({ rawInput }: VisualizerProps) {
  return <DiskCompactionVisualizer rawInput={rawInput} strategy={WHOLE_FILE_COMPACTION_STRATEGY} />;
}
