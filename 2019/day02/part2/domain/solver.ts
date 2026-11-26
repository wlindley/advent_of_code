import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseIntcodeProgram, type IntcodeProgram } from '../../../shared/intcode';
import { traceGravityAssist, type AlarmTraceFrame } from '../../shared';
import { PART2_SEARCH_CONFIG, findGravityAssistMatch } from './search';

/** Synthetic 100-cell Intcode program resolving 1000 * noun + verb + 19678718 = 19690720 at (12, 2). */
export const PART2_EXAMPLE_INPUT =
  `1,0,0,3,2,1,17,0,1,0,2,0,1,0,18,0,99,1000,19678718,${new Array<string>(81).fill('0').join(',')}`;

/** Expected 100 * noun + verb answer string for PART2_EXAMPLE_INPUT. */
export const PART2_EXAMPLE_ANSWER = '1202';

/** AoC 2019 Day 2 Part 2 solver finding (noun, verb) producing 19690720 and tracing the winning run. */
export const solver: Required<PuzzleSolver<IntcodeProgram, bigint, AlarmTraceFrame>> = Object.freeze({
  parse: parseIntcodeProgram,
  solve(program: IntcodeProgram): bigint {
    return findGravityAssistMatch(program, PART2_SEARCH_CONFIG).answerCode;
  },
  trace(program: IntcodeProgram, options?: TraceOptions): readonly AlarmTraceFrame[] {
    const match = findGravityAssistMatch(program, PART2_SEARCH_CONFIG);
    return traceGravityAssist(program, match.inputs, options);
  },
});
