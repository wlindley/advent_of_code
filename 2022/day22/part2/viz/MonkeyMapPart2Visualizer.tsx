import { useMemo } from 'react';
import type { VisualizerProps } from '../../../../shared/viz';
import { CubeNetTopology } from '../../shared';
import { MonkeyMapVisualizer } from '../../shared/viz/MonkeyMapVisualizer';
import { solver } from '../domain';

function inferFaceSize(rawInput: string): number | undefined {
  try {
    return new CubeNetTopology(solver.parse(rawInput).board).faceSize;
  } catch {
    return undefined;
  }
}

/** Part 2 interactive visualizer showing folded-cube board traversal and seam wraps. */
export function MonkeyMapPart2Visualizer({ rawInput }: VisualizerProps) {
  const faceSize = useMemo(() => inferFaceSize(rawInput), [rawInput]);
  return (
    <MonkeyMapVisualizer
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 2 (Folded Cube)"
      faceSize={faceSize}
    />
  );
}
