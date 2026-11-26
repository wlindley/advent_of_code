import type { PuzzleSolver } from '../../../../shared/core';
import {
  ChronospatialProgram,
  parseChronospatialInput,
  traceProgram,
  type VmTraceFrame,
} from '../../shared';
import { searchLowestQuine } from './quineSearch';

export const solver: PuzzleSolver<ChronospatialProgram, bigint, VmTraceFrame> = {
  parse: parseChronospatialInput,
  solve: (program) => searchLowestQuine(program).registerA,
  trace: (program, options) => traceProgram(program.withRegisterA(searchLowestQuine(program).registerA), options),
};
