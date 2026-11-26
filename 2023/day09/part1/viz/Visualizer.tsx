import type { VisualizerProps } from '../../../../shared/viz';
import { DifferencePyramidViz } from '../../shared/viz/DifferencePyramidViz';
import { solver } from '../domain';

export function Visualizer({ rawInput }: VisualizerProps) {
  return <DifferencePyramidViz rawInput={rawInput} solver={solver} />;
}
