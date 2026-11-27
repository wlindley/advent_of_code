import {
  sampleTraceIndices,
  validateMaxSteps,
  type PuzzleSolver,
  type TraceOptions,
} from '../../../shared/core';
import { buildVaultKeyGraph, reconstructSegmentPath } from './keyGraph';
import { parseVaultMap, type GridPoint, type VaultMap } from './vaultMap';
import type { VaultPolicy } from './vaultPolicy';
import { solveVaultOptimal, type VaultHop } from './vaultSearch';

/** Default frame cap for bounded trace playback. */
export const DEFAULT_MAX_TRACE_STEPS = 240;

/** Single sampled visualization frame referencing shared immutable robot trails. */
export interface VaultTraceFrame {
  readonly stepIndex: number;
  readonly totalSteps: number;
  readonly map: VaultMap;
  readonly robotTrails: readonly (readonly GridPoint[])[];
  readonly trailLengths: readonly number[];
  readonly collectedMask: number;
  readonly activeRobotIndex: number;
  readonly expandedStates: number;
}

interface RawStep {
  readonly stepIndex: number;
  readonly trailLengths: readonly number[];
  readonly collectedMask: number;
  readonly activeRobotIndex: number;
}

function appendHopSteps(
  map: VaultMap,
  hop: VaultHop,
  trails: GridPoint[][],
  lengths: number[],
  rawSteps: RawStep[],
  collectedMask: number,
): number {
  const seg = reconstructSegmentPath(
    map,
    map.nodePos(hop.fromNode),
    map.nodePos(hop.toKeyId),
    hop.heldMaskBefore,
  );
  let stepIndex = rawSteps[rawSteps.length - 1]!.stepIndex;
  let nextMask = collectedMask;
  for (let i = 1; i < seg.length; i += 1) {
    trails[hop.robotIndex]!.push(seg[i]!);
    lengths[hop.robotIndex]! += 1;
    stepIndex += 1;
    if (i === seg.length - 1) nextMask |= hop.toKeyBit;
    rawSteps.push({
      stepIndex,
      trailLengths: Object.freeze(lengths.slice()),
      collectedMask: nextMask,
      activeRobotIndex: hop.robotIndex,
    });
  }
  return nextMask;
}

function sampleTraceFrames(
  map: VaultMap,
  rawSteps: readonly RawStep[],
  frozenTrails: readonly (readonly GridPoint[])[],
  totalSteps: number,
  expandedStates: number,
  limit: number,
): readonly VaultTraceFrame[] {
  const sampled = sampleTraceIndices(rawSteps.length, limit);
  return Object.freeze(
    sampled.map((idx) => {
      const raw = rawSteps[idx]!;
      return Object.freeze({
        stepIndex: raw.stepIndex,
        totalSteps,
        map,
        robotTrails: frozenTrails,
        trailLengths: raw.trailLengths,
        collectedMask: raw.collectedMask,
        activeRobotIndex: raw.activeRobotIndex,
        expandedStates,
      });
    }),
  );
}

function buildVaultTrace(map: VaultMap, options?: TraceOptions): readonly VaultTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const solution = solveVaultOptimal(map, buildVaultKeyGraph(map));
  const trails: GridPoint[][] = map.entrances.map((e) => [e]);
  const lengths = map.entrances.map(() => 1);
  const rawSteps: RawStep[] = [
    { stepIndex: 0, trailLengths: Object.freeze(lengths.slice()), collectedMask: 0, activeRobotIndex: -1 },
  ];
  let collectedMask = 0;
  for (const hop of solution.hops) {
    collectedMask = appendHopSteps(map, hop, trails, lengths, rawSteps, collectedMask);
  }
  const frozenTrails = Object.freeze(trails.map((trail) => Object.freeze(trail)));
  return sampleTraceFrames(map, rawSteps, frozenTrails, solution.totalSteps, solution.expandedStates, limit);
}

/** Shared AoC 2019 Day 18 solver parameterized by single- or quad-robot policy. */
export class VaultSolver implements PuzzleSolver<VaultMap, number, VaultTraceFrame> {
  readonly policy: VaultPolicy;

  constructor(policy: VaultPolicy) {
    this.policy = policy;
    Object.freeze(this);
  }

  parse(raw: string): VaultMap {
    return this.policy.prepareMap(parseVaultMap(raw));
  }

  solve(input: VaultMap): number {
    return solveVaultOptimal(input, buildVaultKeyGraph(input)).totalSteps;
  }

  trace(input: VaultMap, options?: TraceOptions): readonly VaultTraceFrame[] {
    return buildVaultTrace(input, options);
  }
}
