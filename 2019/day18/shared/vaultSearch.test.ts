import { describe, expect, it } from 'vitest';
import { DIRS_4 } from '../../../shared/core';
import { buildVaultKeyGraph } from './keyGraph';
import { parseVaultMap, splitVaultForQuadRobots, type VaultMap } from './vaultMap';
import {
  getRobotNode,
  packRobotNodes,
  packVaultState,
  replaceRobotNode,
  solveVaultOptimal,
  unpackVaultState,
} from './vaultSearch';

function rawGridBfsOracle(map: VaultMap): number {
  const allMask = map.allKeysMask;
  if (allMask === 0) return 0;
  const startCells = map.entrances.map((e) => map.cellOf(e.row, e.col));
  const visited = new Set<string>();
  const startKey = `${startCells.join(',')}|0`;
  visited.add(startKey);
  const queue: { cells: number[]; mask: number; dist: number }[] = [
    { cells: startCells, mask: 0, dist: 0 },
  ];

  for (let head = 0; head < queue.length; head += 1) {
    const cur = queue[head]!;
    if (cur.mask === allMask) return cur.dist;
    for (let r = 0; r < cur.cells.length; r += 1) {
      const cell = cur.cells[r]!;
      const row = Math.floor(cell / map.cols);
      const col = cell % map.cols;
      for (const [dr, dc] of DIRS_4) {
        const nr = row + dr;
        const nc = col + dc;
        if (!map.grid.inBounds(nr, nc)) continue;
        const nextCell = nr * map.cols + nc;
        if (map.isWallCell(nextCell)) continue;
        const doorBit = map.doorBitAtCell(nextCell);
        if (doorBit !== 0 && (cur.mask & doorBit) === 0) continue;
        const keyId = map.keyIdAtCell(nextCell);
        const nextMask = keyId >= 0 ? cur.mask | map.keyBitById(keyId) : cur.mask;
        const nextCells = cur.cells.slice();
        nextCells[r] = nextCell;
        const stateKey = `${nextCells.join(',')}|${nextMask}`;
        if (visited.has(stateKey)) continue;
        visited.add(stateKey);
        queue.push({ cells: nextCells, mask: nextMask, dist: cur.dist + 1 });
      }
    }
  }
  return -1;
}

describe('vaultSearch', () => {
  it('packs and unpacks full 46-bit states and 20-bit robot tuples losslessly', () => {
    const packedRobots = packRobotNodes([31, 18, 5, 29]);
    expect(packedRobots).toBe(31 | (18 << 5) | (5 << 10) | (29 << 15));
    expect(getRobotNode(packedRobots, 0)).toBe(31);
    expect(getRobotNode(packedRobots, 2)).toBe(5);
    const updated = replaceRobotNode(packedRobots, 1, 7);
    expect(getRobotNode(updated, 1)).toBe(7);

    const maxKey = packVaultState(0x3ffffff, 0xfffff);
    expect(Number.isSafeInteger(maxKey)).toBe(true);
    expect(unpackVaultState(maxKey)).toEqual({ heldMask: 0x3ffffff, packedRobots: 0xfffff });
  });

  it('returns 0 steps for zero-key maps and throws for unreachable keys', () => {
    const zeroMap = parseVaultMap('###\n#@#\n###');
    expect(solveVaultOptimal(zeroMap, buildVaultKeyGraph(zeroMap))).toEqual({
      totalSteps: 0,
      hops: [],
      expandedStates: 0,
    });

    const blocked = parseVaultMap('#####\n#@#a#\n#####');
    expect(() => solveVaultOptimal(blocked, buildVaultKeyGraph(blocked))).toThrow(/unreachable/);

    const missingKey = parseVaultMap('#####\n#@Aa#\n#####');
    expect(() => solveVaultOptimal(missingKey, buildVaultKeyGraph(missingKey))).toThrow(/unreachable/);
  });

  it('matches independent raw-grid BFS oracle on cyclic single-robot and quad-robot mazes', () => {
    const cyclic = parseVaultMap([
      '#########',
      '#b.a.@.c#',
      '#...#...#',
      '#..B.A..#',
      '#########',
    ].join('\n'));
    const cyclicSol = solveVaultOptimal(cyclic, buildVaultKeyGraph(cyclic));
    expect(cyclicSol.totalSteps).toBe(rawGridBfsOracle(cyclic));

    const quadRaw = [
      '#######',
      '#a.#Cd#',
      '##...##',
      '#..@..#',
      '##...##',
      '#cB#Ab#',
      '#######',
    ].join('\n');
    const quad = splitVaultForQuadRobots(parseVaultMap(quadRaw));
    const quadSol = solveVaultOptimal(quad, buildVaultKeyGraph(quad));
    expect(quadSol.totalSteps).toBe(rawGridBfsOracle(quad));
    expect(quadSol.hops.length).toBe(4);
  });

  it('relaxes suboptimal heap entries on symmetric cyclic key collection orders', () => {
    const staleHeapMap = parseVaultMap([
      '##Bc....d#',
      '#@a.......',
      'b.........',
    ].join('\n'));
    const sol = solveVaultOptimal(staleHeapMap, buildVaultKeyGraph(staleHeapMap));
    expect(sol.totalSteps).toBe(rawGridBfsOracle(staleHeapMap));
  });
});
