import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import {
  buildMixingTrace,
  type EncryptedFile,
  type MixConfig,
  type MixingTraceFrame,
  parseEncryptedFile,
  solveGroveCoordinates,
} from '../../shared';

const PART2_MIX_CONFIG: MixConfig = Object.freeze({ rounds: 10, decryptionKey: 811589153n });

/** Pure TypeScript Part 2 solver applying decryption key 811589153n and 10 mixing rounds. */
export const solver: Required<PuzzleSolver<EncryptedFile, bigint, MixingTraceFrame>> = Object.freeze({
  parse: parseEncryptedFile,
  solve(file: EncryptedFile): bigint {
    return solveGroveCoordinates(file, PART2_MIX_CONFIG);
  },
  trace(file: EncryptedFile, options?: TraceOptions): readonly MixingTraceFrame[] {
    return buildMixingTrace(file, PART2_MIX_CONFIG, options);
  },
});
