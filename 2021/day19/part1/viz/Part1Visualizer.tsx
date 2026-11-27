import type { VisualizerProps } from '../../../../shared/viz';
import { BeaconScannerVisualizer } from '../../shared/viz/BeaconScannerVisualizer';
import { solver } from '../domain';

/** Part 1 interactive 3D scanner alignment and unique-beacon map visualizer. */
export function Part1Visualizer({ rawInput }: VisualizerProps) {
  return <BeaconScannerVisualizer rawInput={rawInput} solver={solver} />;
}
