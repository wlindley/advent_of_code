import type { PuzzleSolver, TraceOptions } from '../../../shared/core';
import type { CaveSystem } from './cave';
import { contractCaveSystem, type ContractedCaveGraph } from './contract';
import { parseCaveSystem } from './parser';
import type { CaveVisitPolicy } from './policy';
import { captureCaveTrace, type CaveTraceFrame } from './trace';

interface SolveContext {
  readonly graph: ContractedCaveGraph;
  readonly policy: CaveVisitPolicy;
  readonly stride: bigint;
  readonly smallCountShift: bigint;
  readonly memo: Map<bigint, bigint>;
}

function countFrom(ctx: SolveContext, u: number, budget: number, visitedMask: bigint): bigint {
  const key = ((BigInt(u) * ctx.stride + BigInt(budget)) << ctx.smallCountShift) | visitedMask;
  const cached = ctx.memo.get(key);
  if (cached !== undefined) return cached;

  let total = ctx.graph.endWeights[u]!;
  for (const transition of ctx.graph.smallTransitions[u]!) {
    const bit = 1n << BigInt(transition.target);
    const alreadyVisited = (visitedMask & bit) !== 0n;
    const nextBudget = ctx.policy.enterSmallCave(budget, alreadyVisited);
    if (nextBudget < 0) continue;
    total += transition.weight * countFrom(ctx, transition.target, nextBudget, visitedMask | bit);
  }
  ctx.memo.set(key, total);
  return total;
}

/** Policy-parameterized AoC 2021 Day 12 solver over big-cave-contracted BigInt DP. */
export class CavePathSolver implements Required<PuzzleSolver<CaveSystem, bigint, CaveTraceFrame>> {
  readonly policy: CaveVisitPolicy;

  constructor(policy: CaveVisitPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): CaveSystem {
    return parseCaveSystem(raw);
  }

  solve(system: CaveSystem): bigint {
    const graph = contractCaveSystem(system);
    const ctx: SolveContext = {
      graph,
      policy: this.policy,
      stride: BigInt(this.policy.initialRevisitBudget + 1),
      smallCountShift: BigInt(graph.smallCaves.length),
      memo: new Map<bigint, bigint>(),
    };

    let total = graph.startToEndWeight;
    for (const transition of graph.startTransitions) {
      total +=
        transition.weight *
        countFrom(
          ctx,
          transition.target,
          this.policy.initialRevisitBudget,
          1n << BigInt(transition.target),
        );
    }
    return total;
  }

  trace(system: CaveSystem, options?: TraceOptions): readonly CaveTraceFrame[] {
    return captureCaveTrace(system, this.policy, this.solve(system), options);
  }
}
