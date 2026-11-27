import type { VisualizerProps } from '../../../../shared/viz';
import { BeaconScannerVisualizer } from '../../shared/viz/BeaconScannerVisualizer';
import { solver } from '../domain';

/** Part 2 interactive 3D scanner alignment and scanner-separation map visualizer. */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  return <BeaconScannerVisualizer rawInput={rawInput} solver={solver} />;
}
