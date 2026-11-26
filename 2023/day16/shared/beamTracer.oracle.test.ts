import { describe, expect, it } from 'vitest';
import { BeamTracer } from './beamTracer';
import { Contraption } from './contraption';
import { type BeamDirection, createBeamState, DIR_E, DIR_N, DIR_S, DIR_W } from './optics';

const OFFICIAL_EXAMPLE_LINES = [
  '.|...\\....', '|.-.\\.....', '.....|-...', '........|.', '..........',
  '.........\\', '..../.\\\\..', '.-.-/..|..', '.|....-|.\\', '..//.|....',
] as const;

const DELTAS: readonly (readonly [number, number])[] = [[-1, 0], [0, 1], [1, 0], [0, -1]];

function nextDirectionsForTile(tile: string, dir: BeamDirection): readonly BeamDirection[] {
  switch (tile) {
    case '.': return [dir];
    case '/': return [dir === DIR_N ? DIR_E : dir === DIR_E ? DIR_N : dir === DIR_S ? DIR_W : DIR_S];
    case '\\': return [dir === DIR_N ? DIR_W : dir === DIR_E ? DIR_S : dir === DIR_S ? DIR_E : DIR_N];
    case '|': return dir === DIR_E || dir === DIR_W ? [DIR_N, DIR_S] : [dir];
    case '-': return dir === DIR_N || dir === DIR_S ? [DIR_E, DIR_W] : [dir];
    default: throw new Error(`Unexpected tile ${tile}`);
  }
}

/** Independent plain-JS reference oracle (zero bitmasks, zero typed arrays). */
function oracleCountEnergized(lines: readonly string[], startRow: number, startCol: number, startDir: BeamDirection): number {
  const height = lines.length;
  const width = lines[0]!.length;
  const seenStates = new Set<string>([`${startRow},${startCol},${startDir}`]);
  const energizedCells = new Set<string>([`${startRow},${startCol}`]);
  const queue: Array<[number, number, BeamDirection]> = [[startRow, startCol, startDir]];
  for (let head = 0; head < queue.length; head += 1) {
    const [r, c, d] = queue[head]!;
    for (const nextDir of nextDirectionsForTile(lines[r]![c]!, d)) {
      const [dr, dc] = DELTAS[nextDir]!;
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc},${nextDir}`;
      if (nr < 0 || nr >= height || nc < 0 || nc >= width || seenStates.has(key)) continue;
      seenStates.add(key);
      energizedCells.add(`${nr},${nc}`);
      queue.push([nr, nc, nextDir]);
    }
  }
  return energizedCells.size;
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function generateGrid(height: number, width: number, density: number, rng: () => number): string[] {
  const optics = ['/', '\\', '|', '-'] as const;
  return Array.from({ length: height }, () =>
    Array.from({ length: width }, () => (rng() < density ? optics[Math.floor(rng() * 4)]! : '.')).join(''),
  );
}

describe('BeamTracer differential oracle verification', () => {
  it('matches oracle across all 40 perimeter entries of the official 10x10 example', () => {
    const contraption = Contraption.fromLines(OFFICIAL_EXAMPLE_LINES);
    const tracer = new BeamTracer(contraption);
    let maxScore = 0;
    for (const entry of contraption.edgeEntries()) {
      const actual = tracer.countEnergized(entry);
      expect(actual).toBe(oracleCountEnergized(OFFICIAL_EXAMPLE_LINES, entry.row, entry.col, entry.dir));
      if (actual > maxScore) maxScore = actual;
    }
    expect(maxScore).toBe(51);
  });

  it('matches oracle on all five 1x1 grids and corner entry optics', () => {
    for (const ch of ['.', '/', '\\', '|', '-'] as const) {
      const contraption = Contraption.fromLines([ch]);
      const tracer = new BeamTracer(contraption);
      for (const entry of contraption.edgeEntries()) {
        expect(tracer.countEnergized(entry)).toBe(oracleCountEnergized([ch], entry.row, entry.col, entry.dir));
      }
    }
    for (const lines of [['\\..', '|..', '...'], ['/..', '...', '...'], ['|..', '...', '...'], ['-..', '...', '...']]) {
      const tracer = new BeamTracer(Contraption.fromLines(lines));
      expect(tracer.countEnergized(createBeamState(0, 0, DIR_E))).toBe(oracleCountEnergized(lines, 0, 0, DIR_E));
    }
  });

  it('matches oracle on closed figure-8 loops and dual-sided splitter convergence', () => {
    const figure8 = ['./\\..', '.\\-/.', './-\\.', '.\\/.\\'];
    const dualSplit = ['.....', '.|.|.', '..-..', '.|.|.', '.....'];
    for (const lines of [figure8, dualSplit]) {
      const contraption = Contraption.fromLines(lines);
      const tracer = new BeamTracer(contraption);
      for (const entry of contraption.edgeEntries()) {
        expect(tracer.countEnergized(entry)).toBe(oracleCountEnergized(lines, entry.row, entry.col, entry.dir));
      }
    }
  });

  it('matches oracle across 40 seeded random grids of varied shapes and optical densities', () => {
    const rng = makeRng(202316);
    const shapes: readonly (readonly [number, number])[] = [[1, 7], [7, 1], [5, 5], [12, 15], [25, 25]];
    const densities = [0.1, 0.25, 0.5, 0.8];
    for (let i = 0; i < 40; i += 1) {
      const [h, w] = shapes[i % shapes.length]!;
      const lines = generateGrid(h, w, densities[i % densities.length]!, rng);
      const contraption = Contraption.fromLines(lines);
      const tracer = new BeamTracer(contraption);
      const edges = contraption.edgeEntries();
      for (let s = 0; s < 4; s += 1) {
        const entry = edges[Math.floor(rng() * edges.length)]!;
        const expected = oracleCountEnergized(lines, entry.row, entry.col, entry.dir);
        expect(tracer.countEnergized(entry)).toBe(expected);
        const frames = tracer.traceWaves(entry, { maxSteps: 10 });
        expect(frames[frames.length - 1]!.energizedCount).toBe(expected);
      }
    }
  });
});
