import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildMixingTrace,
  type EncryptedFile,
  type MixConfig,
  type MixingTraceFrame,
  parseEncryptedFile,
  solveGroveCoordinates,
} from '../../shared';

const PART1_MIX_CONFIG: MixConfig = Object.freeze({ rounds: 1, decryptionKey: 1n });

/** Pure TypeScript Part 1 solver mixing once with key 1n and summing grove coordinates. */
export const solver: Required<PuzzleSolver<EncryptedFile, bigint, MixingTraceFrame>> = {
  parse: parseEncryptedFile,
  solve(file: EncryptedFile): bigint {
    return solveGroveCoordinates(file, PART1_MIX_CONFIG);
  },
  trace(file: EncryptedFile, options?: TraceOptions): readonly MixingTraceFrame[] {
    return buildMixingTrace(file, PART1_MIX_CONFIG, options);
  },
};
