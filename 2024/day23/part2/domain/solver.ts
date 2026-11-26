import type { PuzzleSolver } from '../../../../shared/core';
import {
  type LanGraph,
  type LanPartySnapshot,
  buildMaximumCliqueTrace,
  findMaximumClique,
  parseLanGraph,
} from '../../shared';

/** Finds the comma-separated sorted password of the maximum LAN clique. */
export function solvePart2(graph: LanGraph): string {
  return findMaximumClique(graph).password;
}

export const solver: PuzzleSolver<LanGraph, string, LanPartySnapshot> = Object.freeze({
  parse: parseLanGraph,
  solve: solvePart2,
  trace: buildMaximumCliqueTrace,
});
