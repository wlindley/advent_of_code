import { classifyCave, END_CAVE, START_CAVE, type CaveSystem } from './cave';

export interface WeightedTransition {
  readonly target: number;
  readonly weight: bigint;
}

export interface ContractedCaveGraph {
  readonly smallCaves: readonly string[];
  readonly startToEndWeight: bigint;
  readonly startTransitions: readonly WeightedTransition[];
  readonly endWeights: readonly bigint[];
  readonly smallTransitions: readonly (readonly WeightedTransition[])[];
}

interface ContractionAccumulator {
  readonly smallIndex: ReadonlyMap<string, number>;
  startToEndWeight: bigint;
  readonly startToSmall: bigint[];
  readonly endWeights: bigint[];
  readonly smallMatrix: bigint[][];
}

function createAccumulator(smallCaves: readonly string[]): ContractionAccumulator {
  const count = smallCaves.length;
  const smallIndex = new Map<string, number>();
  const smallMatrix: bigint[][] = [];
  for (let i = 0; i < count; i += 1) {
    smallIndex.set(smallCaves[i]!, i);
    smallMatrix.push(new Array<bigint>(count).fill(0n));
  }
  return {
    smallIndex,
    startToEndWeight: 0n,
    startToSmall: new Array<bigint>(count).fill(0n),
    endWeights: new Array<bigint>(count).fill(0n),
    smallMatrix,
  };
}

function addDirectedStep(acc: ContractionAccumulator, from: string, to: string): void {
  if (from === START_CAVE) {
    if (to === END_CAVE) {
      acc.startToEndWeight += 1n;
      return;
    }
    const targetIdx = acc.smallIndex.get(to)!;
    acc.startToSmall[targetIdx]! += 1n;
    return;
  }
  const fromIdx = acc.smallIndex.get(from)!;
  if (to === END_CAVE) {
    acc.endWeights[fromIdx]! += 1n;
    return;
  }
  const toIdx = acc.smallIndex.get(to)!;
  acc.smallMatrix[fromIdx]![toIdx]! += 1n;
}

function addDirectNonBigEdges(acc: ContractionAccumulator, system: CaveSystem): void {
  for (const edge of system.edges) {
    if (classifyCave(edge.a) === 'big' || classifyCave(edge.b) === 'big') continue;
    if (edge.a !== END_CAVE && edge.b !== START_CAVE) {
      addDirectedStep(acc, edge.a, edge.b);
    }
    if (edge.b !== END_CAVE && edge.a !== START_CAVE) {
      addDirectedStep(acc, edge.b, edge.a);
    }
  }
}

function addBigCaveBridges(acc: ContractionAccumulator, system: CaveSystem): void {
  for (const cave of system.caves) {
    if (classifyCave(cave) !== 'big') continue;
    const neighbors = system.neighborsOf(cave);
    for (const u of neighbors) {
      if (u === END_CAVE) continue;
      for (const v of neighbors) {
        if (v === START_CAVE) continue;
        addDirectedStep(acc, u, v);
      }
    }
  }
}

function toTransitionList(weights: readonly bigint[]): readonly WeightedTransition[] {
  const transitions: WeightedTransition[] = [];
  for (let target = 0; target < weights.length; target += 1) {
    const weight = weights[target]!;
    if (weight > 0n) {
      transitions.push(Object.freeze({ target, weight }));
    }
  }
  return Object.freeze(transitions);
}

/**
 * Contracts big caves into weighted transitions among `start`, regular small caves, and `end`.
 * Iterates all ordered neighbor pairs `(u, v)` around each big cave, including `u === v`.
 */
export function contractCaveSystem(system: CaveSystem): ContractedCaveGraph {
  const smallCaves = system.caves.filter((cave) => classifyCave(cave) === 'small');
  const acc = createAccumulator(smallCaves);
  addDirectNonBigEdges(acc, system);
  addBigCaveBridges(acc, system);

  return Object.freeze({
    smallCaves: Object.freeze(smallCaves),
    startToEndWeight: acc.startToEndWeight,
    startTransitions: toTransitionList(acc.startToSmall),
    endWeights: Object.freeze(acc.endWeights),
    smallTransitions: Object.freeze(acc.smallMatrix.map(toTransitionList)),
  });
}
