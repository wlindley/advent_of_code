import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { CpuProgram, CpuTimeline } from '../../shared';
import { decodeCrtScreen, rasterizeCrtScreen } from './screen';
import { CrtBeamTraceFrame, buildCrtBeamTrace } from './trace';

/** Executes a CPU program, rasterizes cycles 1..240, and decodes the 8-letter CRT output. */
export function solvePart2(program: CpuProgram): string {
  const timeline = CpuTimeline.execute(program);
  const screen = rasterizeCrtScreen(timeline);
  return decodeCrtScreen(screen);
}

/** Executes a CPU program and produces a bounded per-cycle CRT beam trace. */
export function tracePart2(
  program: CpuProgram,
  options?: TraceOptions,
): readonly CrtBeamTraceFrame[] {
  const timeline = CpuTimeline.execute(program);
  return buildCrtBeamTrace(timeline, options);
}

/** Pure domain solver contract for Advent of Code 2022 Day 10 Part 2. */
export const solver: PuzzleSolver<CpuProgram, string, CrtBeamTraceFrame> = Object.freeze({
  parse: (raw: string) => CpuProgram.parse(raw),
  solve: solvePart2,
  trace: tracePart2,
});
