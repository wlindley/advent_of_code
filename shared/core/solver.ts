export type PuzzlePart = 1 | 2;

export type RuntimeMode = 'main-thread' | 'web-worker' | 'rust-cli';

export interface Clock {
  nowMs(): number;
}

export const systemClock: Clock = {
  nowMs: () => performance.now(),
};

export interface PuzzleMeta {
  readonly year: number;
  readonly day: number;
  readonly part: PuzzlePart;
  readonly title: string;
  readonly puzzleUrl: string;
  readonly summary: string;
  readonly algorithmSummary: string;
  readonly complexity: string;
}

export interface TraceOptions {
  readonly maxSteps?: number;
}

export interface PuzzleSolver<TInput, TAnswer, TTrace = unknown> {
  parse(raw: string): TInput;
  solve(input: TInput): TAnswer;
  trace?(input: TInput, options?: TraceOptions): readonly TTrace[];
}

export interface SolveExecution<TAnswer> {
  readonly answer: TAnswer;
  readonly elapsedMs: number;
  readonly runtime: RuntimeMode;
}

export function executeSolver<TInput, TAnswer, TTrace>(
  solver: PuzzleSolver<TInput, TAnswer, TTrace>,
  rawInput: string,
  clock: Clock = systemClock,
): SolveExecution<TAnswer> {
  const startMs = clock.nowMs();
  const parsed = solver.parse(rawInput);
  const answer = solver.solve(parsed);
  // Guard against minor timer jitter or non-monotonic test clocks.
  const elapsedMs = Math.max(0, clock.nowMs() - startMs);

  return {
    answer,
    elapsedMs,
    runtime: 'main-thread',
  };
}

export function formatDayFolder(day: number): string {
  if (!Number.isInteger(day) || day < 1 || day > 25) {
    throw new Error('Day must be an integer between 1 and 25');
  }
  return `day${String(day).padStart(2, '0')}`;
}

export function formatPartKey(year: number, day: number, part: PuzzlePart): string {
  if (!Number.isInteger(year) || year < 2015) {
    throw new Error('Year must be an integer >= 2015');
  }
  return `${year}/${formatDayFolder(day)}/part${part}`;
}
