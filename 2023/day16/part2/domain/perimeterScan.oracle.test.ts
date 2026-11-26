import { describe, expect, it } from 'vitest';
import {
  type BeamDirection,
  type BeamState,
  DIR_E,
  DIR_N,
  DIR_S,
  DIR_W,
  parseContraption,
} from '../../shared';
import { scanPerimeter } from './perimeterScan';

const OFFICIAL_EXAMPLE_LINES = [
  '.|...\\....',
  '|.-.\\.....',
  '.....|-...',
  '........|.',
  '..........',
  '.........\\',
  '..../.\\\\..',
  '.-.-/..|..',
  '.|....-|.\\',
  '..//.|....',
] as const;

const ORACLE_DR = [-1, 0, 1, 0] as const;
const ORACLE_DC = [0, 1, 0, -1] as const;

function oracleNextDirs(tile: string, dir: BeamDirection): readonly BeamDirection[] {
  if (tile === '/') return [([DIR_E, DIR_N, DIR_W, DIR_S] as const)[dir]!];
  if (tile === '\\') return [([DIR_W, DIR_S, DIR_E, DIR_N] as const)[dir]!];
  if (tile === '|' && (dir === DIR_E || dir === DIR_W)) return [DIR_N, DIR_S];
  if (tile === '-' && (dir === DIR_N || dir === DIR_S)) return [DIR_W, DIR_E];
  return [dir];
}

function oracleCountEnergized(lines: readonly string[], entry: BeamState): number {
  const h = lines.length;
  const w = lines[0]!.length;
  const seenStates = new Set<string>([`${entry.row},${entry.col},${entry.dir}`]);
  const energized = new Set<string>([`${entry.row},${entry.col}`]);
  const queue: BeamState[] = [entry];
  for (let head = 0; head < queue.length; head += 1) {
    const cur = queue[head]!;
    for (const nextDir of oracleNextDirs(lines[cur.row]![cur.col]!, cur.dir)) {
      const nr = cur.row + ORACLE_DR[nextDir]!;
      const nc = cur.col + ORACLE_DC[nextDir]!;
      if (nr < 0 || nr >= h || nc < 0 || nc >= w) continue;
      const stateKey = `${nr},${nc},${nextDir}`;
      if (seenStates.has(stateKey)) continue;
      seenStates.add(stateKey);
      energized.add(`${nr},${nc}`);
      queue.push({ row: nr, col: nc, dir: nextDir });
    }
  }
  return energized.size;
}

function makeSeededGrid(rows: number, cols: number, seedInit: number): string[] {
  const tiles = ['.', '.', '.', '/', '\\', '|', '-'] as const;
  let state = seedInit >>> 0;
  const grid: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let row = '';
    for (let c = 0; c < cols; c += 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      row += tiles[state % tiles.length]!;
    }
    grid.push(row);
  }
  return grid;
}

function assertMatchesOracle(lines: readonly string[]): void {
  const contraption = parseContraption(lines.join('\n'));
  const scan = scanPerimeter(contraption);
  let oracleMax = 0;
  expect(scan.scores.length).toBe(2 * (lines.length + lines[0]!.length));
  for (const score of scan.scores) {
    const expected = oracleCountEnergized(lines, score.entry);
    expect(score.energizedCount).toBe(expected);
    if (expected > oracleMax) oracleMax = expected;
  }
  expect(scan.best.energizedCount).toBe(oracleMax);
}

describe('scanPerimeter differential oracle', () => {
  it('matches plain-JS Set oracle on official example, loops, and seeded grids', () => {
    assertMatchesOracle(OFFICIAL_EXAMPLE_LINES);
    assertMatchesOracle(['.']);
    assertMatchesOracle(['.-\\..', './|-.', '..\\-/']);
    assertMatchesOracle(['/-\\', '|.|', '\\-/']);
    assertMatchesOracle(makeSeededGrid(7, 7, 1337));
    assertMatchesOracle(makeSeededGrid(7, 7, 4242));
  });
});
