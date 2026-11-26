import type { PuzzleSolver } from '../../../../shared/core';
import {
  type DoorCode,
  KeypadConfig,
  type KeypadConundrumSnapshot,
  PART2_DIRECTIONAL_ROBOTS,
  createKeypadConundrumSolver,
  solveDoorCodes,
} from '../../shared';

export const PART2_CONFIG = new KeypadConfig(PART2_DIRECTIONAL_ROBOTS);

/** Computes the total complexity across `codes` for 25 directional robot layers. */
export function solvePart2(codes: readonly DoorCode[]): bigint {
  return solveDoorCodes(codes, PART2_CONFIG).totalComplexity;
}

export const solver: PuzzleSolver<readonly DoorCode[], bigint, KeypadConundrumSnapshot> =
  createKeypadConundrumSolver(PART2_CONFIG);
