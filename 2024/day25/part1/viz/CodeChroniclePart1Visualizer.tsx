import type { VisualizerProps } from '../../../../shared/viz';
import { type TumblerInventory, type TumblerTraceFrame, buildMatchTrace } from '../../shared';
import { CodeChronicleVisualizer } from '../../shared/viz/CodeChronicleVisualizer';

export const PART1_EXAMPLE_INPUT = [
  '#####\n.####\n.####\n.####\n.#.#.\n.#...\n.....',
  '#####\n##.##\n.#.##\n...##\n...#.\n...#.\n.....',
  '.....\n#....\n#....\n#...#\n#.#.#\n#.###\n#####',
  '.....\n.....\n#.#..\n###..\n###.#\n###.#\n#####',
  '.....\n.....\n.....\n#....\n#.#..\n#.#.#\n#####',
].join('\n\n');

function buildPart1Trace(inventory: TumblerInventory): readonly TumblerTraceFrame[] {
  return buildMatchTrace(inventory);
}

function formatPart1Answer(frame: TumblerTraceFrame): string {
  return String(frame.matchCount);
}

/** Interactive Part 1 Code Chronicle visualizer (lock/key pin-chamber clearance scan). */
export function CodeChroniclePart1Visualizer({ rawInput }: VisualizerProps) {
  return (
    <CodeChronicleVisualizer
      rawInput={rawInput}
      cacheKey="part1-match"
      buildTrace={buildPart1Trace}
      summaryLabel="Fitting Pairs"
      formatAnswer={formatPart1Answer}
    />
  );
}
