import type { PuzzleSolver } from '../../../../shared/core';
import {
  ChronospatialProgram,
  formatOutput,
  parseChronospatialInput,
  runProgram,
  traceProgram,
  type VmTraceFrame,
} from '../../shared';

export const solver: PuzzleSolver<ChronospatialProgram, string, VmTraceFrame> = {
  parse: parseChronospatialInput,
  solve: (program) => formatOutput(runProgram(program).output),
  trace: traceProgram,
};
