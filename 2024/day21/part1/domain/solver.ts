import type { PuzzleSolver } from '../../../../shared/core';
import {
  type DoorCode,
  KeypadConfig,
  type KeypadConundrumSnapshot,
  PART1_DIRECTIONAL_ROBOTS,
  createKeypadConundrumSolver,
  solveDoorCodes,
} from '../../shared';

export const PART1_CONFIG = new KeypadConfig(PART1_DIRECTIONAL_ROBOTS);

/** Computes the total complexity across `codes` for 2 directional robot layers. */
export function solvePart1(codes: readonly DoorCode[]): bigint {
  return solveDoorCodes(codes, PART1_CONFIG).totalComplexity;
}

export const solver: PuzzleSolver<readonly DoorCode[], bigint, KeypadConundrumSnapshot> =
  createKeypadConundrumSolver(PART1_CONFIG);
