import { describe, expect, it } from 'vitest';
import { WastelandNetwork, parseWastelandNetwork, type NetworkNodeSpec, type Turn } from '../../shared';
import { solveHauntedWastelandPart2 } from './convergence';

/** Independent brute-force lockstep oracle with zero cycle or CRT logic. */
function lockstepGhostOracle(network: WastelandNetwork, stepBudget: number): bigint | undefined {
  const positions: number[] = [];
  for (let id = 0; id < network.nodeCount; id += 1) {
    if (network.labelOf(id).endsWith('A')) positions.push(id);
  }
  if (positions.length === 0) return undefined;

  let ip = 0;
  for (let step = 1; step <= stepBudget; step += 1) {
    for (let g = 0; g < positions.length; g += 1) {
      positions[g] = network.stepFrom(positions[g]!, ip);
    }
    ip = ip + 1 === network.tapeLength ? 0 : ip + 1;
    if (positions.every((id) => network.labelOf(id).endsWith('Z'))) {
      return BigInt(step);
    }
  }
  return undefined;
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function buildRandomNetwork(seed: number): WastelandNetwork {
  const rand = makeRng(seed);
  const tapeLen = 1 + Math.floor(rand() * 7);
  const nodeCount = 6 + Math.floor(rand() * 13);
  const ghostCount = 2 + Math.floor(rand() * 3);
  const targetCount = 1 + Math.floor(rand() * Math.min(3, nodeCount - ghostCount));

  const turns: Turn[] = Array.from({ length: tapeLen }, () => (rand() < 0.5 ? 'L' : 'R'));
  const nodes: NetworkNodeSpec[] = Array.from({ length: nodeCount }, (_, i) => {
    let suffix = 'B';
    if (i < ghostCount) suffix = 'A';
    else if (i < ghostCount + targetCount) suffix = 'Z';
    return {
      label: `${String(i).padStart(2, '0')}${suffix}`,
      leftId: Math.floor(rand() * nodeCount),
      rightId: Math.floor(rand() * nodeCount),
    };
  });
  return new WastelandNetwork(turns, nodes);
}

describe('solveHauntedWastelandPart2 vs lockstepGhostOracle', () => {
  it('matches oracle on official example, G=1, pre-cycle, mixed hits, offsets, and multi-Z cycles', () => {
    const cases: readonly string[] = [
      'LR\n\n11A = (11B, XXX)\n11B = (XXX, 11Z)\n11Z = (11B, XXX)\n22A = (22B, XXX)\n22B = (22C, 22C)\n22C = (22Z, 22Z)\n22Z = (22B, 22B)\nXXX = (XXX, XXX)',
      'RL\n\n11A = (11B, 11C)\n11B = (11Z, 11A)\n11C = (11Z, 11B)\n11Z = (11A, 11B)',
      'L\n\n11A = (11Z, 11Z)\n11Z = (11B, 11B)\n11B = (11B, 11B)\n22A = (22Z, 22Z)\n22Z = (22A, 22A)',
      'LR\n\n11A = (11Z, 11B)\n11Z = (11B, 11C)\n11B = (11C, 21Z)\n11C = (11Z, 11B)\n21Z = (11B, 11B)\n22A = (22B, 22B)\n22B = (22Z, 22Z)\n22Z = (22C, 22C)\n22C = (22B, 22B)',
    ];
    for (const raw of cases) {
      const net = parseWastelandNetwork(raw);
      expect(solveHauntedWastelandPart2(net)).toBe(lockstepGhostOracle(net, 5000));
    }
  });

  it('rejects unreachable and incompatible graphs where oracle finds no match', () => {
    const unreachable = parseWastelandNetwork('L\n\n11A = (11B, 11B)\n11B = (11B, 11B)');
    expect(() => solveHauntedWastelandPart2(unreachable)).toThrow();
    expect(lockstepGhostOracle(unreachable, 200)).toBeUndefined();

    const incompatible = parseWastelandNetwork(
      'L\n\n11A = (11Z, 11Z)\n11Z = (11A, 11A)\n22A = (22B, 22B)\n22B = (22Z, 22Z)\n22Z = (22C, 22C)\n22C = (22A, 22A)',
    );
    expect(() => solveHauntedWastelandPart2(incompatible)).toThrow();
    expect(lockstepGhostOracle(incompatible, 200)).toBeUndefined();
  });

  it('agrees 100% across 40 deterministic seeded random multi-ghost graphs', () => {
    for (let seed = 1001; seed <= 1040; seed += 1) {
      const net = buildRandomNetwork(seed);
      let solved: bigint | undefined;
      try {
        solved = solveHauntedWastelandPart2(net);
      } catch {
        solved = undefined;
      }

      if (solved === undefined) {
        expect(lockstepGhostOracle(net, 5000)).toBeUndefined();
      } else {
        const budget = Number(solved <= 200_000n ? solved : 5000n);
        const oracle = lockstepGhostOracle(net, budget);
        if (solved <= 200_000n) {
          expect(oracle).toBe(solved);
        } else {
          expect(oracle).toBeUndefined();
        }
      }
    }
  });
});
