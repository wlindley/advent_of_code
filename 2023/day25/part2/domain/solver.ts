import { createFinaleSolver, type FinaleTraceFrame, type PuzzleSolver } from '../../../../shared/core';

export const TOTAL_2023_STARS = 50;

export const solver: Required<PuzzleSolver<number, number, FinaleTraceFrame>> =
  createFinaleSolver(TOTAL_2023_STARS);
