import type { VisualizerProps } from '../../../../shared/viz';
import { ANY_YES_POLICY } from '../../shared';
import { CustomsVisualizer } from '../../shared/viz/CustomsVisualizer';

export function CustomCustomsPart1Visualizer({ rawInput }: VisualizerProps) {
  return <CustomsVisualizer rawInput={rawInput} policy={ANY_YES_POLICY} />;
}
