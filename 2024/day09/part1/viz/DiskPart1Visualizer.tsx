import type { VisualizerProps } from '../../../../shared/viz';
import { DiskCompactionVisualizer } from '../../shared/viz/DiskCompactionVisualizer';
import { BLOCK_COMPACTION_STRATEGY } from '../domain';

/** Part 1 visualizer binding the block-by-block compaction strategy. */
export function DiskPart1Visualizer({ rawInput }: VisualizerProps) {
  return <DiskCompactionVisualizer rawInput={rawInput} strategy={BLOCK_COMPACTION_STRATEGY} />;
}
