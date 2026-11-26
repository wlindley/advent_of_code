import type { VisualizerProps } from '../../../../shared/viz';
import { STRICT_FIELD_POLICY } from '../../shared';
import { PassportScanVisualizer } from '../../shared/viz/PassportScanVisualizer';

export function PassportProcessingPart2Visualizer({ rawInput }: VisualizerProps) {
  return <PassportScanVisualizer rawInput={rawInput} policy={STRICT_FIELD_POLICY} />;
}
