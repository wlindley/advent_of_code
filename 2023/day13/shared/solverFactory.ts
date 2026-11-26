import type { PuzzleSolver } from '../../../shared/core';
import { parseMirrorPatterns, type MirrorPattern } from './pattern';
import { summarizePatterns, validateTargetSmudges } from './reflection';
import { buildIncidenceTrace, type IncidenceTraceFrame } from './trace';

/** Builds a frozen `PuzzleSolver` parameterized by a validated `targetSmudges` count. */
export function createIncidenceSolver(
  targetSmudges: number,
): PuzzleSolver<readonly MirrorPattern[], number, IncidenceTraceFrame> {
  validateTargetSmudges(targetSmudges);
  const solver: PuzzleSolver<readonly MirrorPattern[], number, IncidenceTraceFrame> = {
    parse: parseMirrorPatterns,
    solve: (patterns) => summarizePatterns(patterns, targetSmudges),
    trace: (patterns, options) => buildIncidenceTrace(patterns, targetSmudges, options),
  };
  return Object.freeze(solver);
}
