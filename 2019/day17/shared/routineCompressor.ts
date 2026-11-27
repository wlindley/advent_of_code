/** Maximum ASCII length (excluding newline) of Main or any subroutine line. */
export const MAX_ROUTINE_CHARS = 20;
/** Maximum number of subroutine calls in the Main routine. */
export const MAX_MAIN_CALLS = 10;
/** Maximum number of movement tokens in a single subroutine. */
export const MAX_ROUTINE_TOKENS = 10;

/** Subroutine identifier allowed in the Intcode ASCII vacuum program. */
export type RoutineName = 'A' | 'B' | 'C';

const ROUTINE_NAMES: readonly RoutineName[] = Object.freeze(['A', 'B', 'C']);
const COMMAND_TOKEN_RE = /^(?:L|R|[1-9]\d*)$/;

function validateCommandTokens(label: string, tokens: readonly string[]): void {
  if (tokens.length === 0) {
    throw new RangeError(`${label} cannot be empty`);
  }
  for (let i = 0; i < tokens.length; i += 1) {
    if (!COMMAND_TOKEN_RE.test(tokens[i]!)) {
      throw new Error(`Invalid movement token "${tokens[i]!}" in ${label}`);
    }
  }
  const textLength = tokens.join(',').length;
  if (textLength > MAX_ROUTINE_CHARS) {
    throw new RangeError(`${label} exceeds ${MAX_ROUTINE_CHARS} characters (${textLength})`);
  }
}

/** Validated Main + A/B/C subroutine compression plan for Part 2 dust collection. */
export class RoutinePlan {
  readonly main: readonly RoutineName[];
  readonly routineA: readonly string[];
  readonly routineB: readonly string[];
  readonly routineC: readonly string[];

  constructor(
    main: readonly RoutineName[],
    routineA: readonly string[],
    routineB: readonly string[],
    routineC: readonly string[],
  ) {
    if (main.length === 0 || main.length > MAX_MAIN_CALLS) {
      throw new RangeError(`Main routine must have 1..${MAX_MAIN_CALLS} calls`);
    }
    validateCommandTokens('Routine A', routineA);
    validateCommandTokens('Routine B', routineB);
    validateCommandTokens('Routine C', routineC);
    this.main = Object.freeze([...main]);
    this.routineA = Object.freeze([...routineA]);
    this.routineB = Object.freeze([...routineB]);
    this.routineC = Object.freeze([...routineC]);
    Object.freeze(this);
  }

  get mainText(): string {
    return this.main.join(',');
  }

  get routineAText(): string {
    return this.routineA.join(',');
  }

  get routineBText(): string {
    return this.routineB.join(',');
  }

  get routineCText(): string {
    return this.routineC.join(',');
  }

  toAsciiProgram(continuousFeed: boolean): string {
    const feed = continuousFeed ? 'y' : 'n';
    return `${this.mainText}\n${this.routineAText}\n${this.routineBText}\n${this.routineCText}\n${feed}\n`;
  }
}

interface SearchMatch {
  readonly main: RoutineName[];
  readonly routines: string[][];
}

function routinesMatchAt(tokens: readonly string[], pos: number, routine: readonly string[]): boolean {
  if (pos + routine.length > tokens.length) return false;
  for (let i = 0; i < routine.length; i += 1) {
    if (tokens[pos + i] !== routine[i]) return false;
  }
  return true;
}

function candidateSlices(tokens: readonly string[], pos: number): string[][] {
  const maxSlice = Math.min(MAX_ROUTINE_TOKENS, tokens.length - pos);
  const slices: string[][] = [];
  for (let len = maxSlice; len >= 1; len -= 1) {
    const slice = tokens.slice(pos, pos + len);
    if (slice.join(',').length <= MAX_ROUTINE_CHARS) slices.push(slice);
  }
  return slices;
}

function matchWithThreeRoutines(
  tokens: readonly string[],
  pos: number,
  calls: RoutineName[],
  routines: readonly (readonly string[])[],
  maxLen: number,
  failed: Set<number>,
): RoutineName[] | null {
  if (pos === tokens.length) return [...calls];
  const remainingCalls = MAX_MAIN_CALLS - calls.length;
  if (remainingCalls === 0 || pos + remainingCalls * maxLen < tokens.length) return null;
  const stateKey = pos * (MAX_MAIN_CALLS + 1) + calls.length;
  if (failed.has(stateKey)) return null;
  for (let i = 0; i < routines.length; i += 1) {
    const routine = routines[i]!;
    if (routinesMatchAt(tokens, pos, routine)) {
      calls.push(ROUTINE_NAMES[i]!);
      const solved = matchWithThreeRoutines(tokens, pos + routine.length, calls, routines, maxLen, failed);
      if (solved !== null) return solved;
      calls.pop();
    }
  }
  failed.add(stateKey);
  return null;
}

function tryNewRoutines(
  tokens: readonly string[],
  pos: number,
  calls: RoutineName[],
  routines: string[][],
): SearchMatch | null {
  for (const slice of candidateSlices(tokens, pos)) {
    if (routines.some((r) => r.length === slice.length && routinesMatchAt(r, 0, slice))) continue;
    routines.push(slice);
    calls.push(ROUTINE_NAMES[routines.length - 1]!);
    if (routines.length === 3) {
      const maxLen = Math.max(routines[0]!.length, routines[1]!.length, routines[2]!.length);
      const main = matchWithThreeRoutines(tokens, pos + slice.length, calls, routines, maxLen, new Set());
      if (main !== null) return { main, routines: routines.map((r) => [...r]) };
    } else {
      const solved = searchRoutines(tokens, pos + slice.length, calls, routines);
      if (solved !== null) return solved;
    }
    calls.pop();
    routines.pop();
  }
  return null;
}

function searchRoutines(
  tokens: readonly string[],
  pos: number,
  calls: RoutineName[],
  routines: string[][],
): SearchMatch | null {
  if (pos === tokens.length) return { main: [...calls], routines: routines.map((r) => [...r]) };
  const remainingCalls = MAX_MAIN_CALLS - calls.length;
  if (remainingCalls === 0 || pos + remainingCalls * MAX_ROUTINE_TOKENS < tokens.length) return null;
  for (let i = 0; i < routines.length; i += 1) {
    const routine = routines[i]!;
    if (routinesMatchAt(tokens, pos, routine)) {
      calls.push(ROUTINE_NAMES[i]!);
      const solved = searchRoutines(tokens, pos + routine.length, calls, routines);
      if (solved !== null) return solved;
      calls.pop();
    }
  }
  return tryNewRoutines(tokens, pos, calls, routines);
}

/** Compresses a scaffold movement token sequence into Main + A/B/C subroutines. */
export function compressPath(tokens: readonly string[]): RoutinePlan {
  if (tokens.length === 0) throw new RangeError('Path tokens cannot be empty');
  if (tokens.length > MAX_MAIN_CALLS * MAX_ROUTINE_TOKENS) {
    throw new Error(`Path length ${tokens.length} exceeds maximum ${MAX_MAIN_CALLS * MAX_ROUTINE_TOKENS}`);
  }
  for (let i = 0; i < tokens.length; i += 1) {
    if (!COMMAND_TOKEN_RE.test(tokens[i]!)) {
      throw new Error(`Invalid movement token "${tokens[i]!}" at index ${i}`);
    }
  }
  const result = searchRoutines(tokens, 0, [], []);
  if (result === null) throw new Error('Unable to compress scaffold path into 3 routines');
  return new RoutinePlan(
    result.main,
    result.routines[0]!,
    result.routines[1] ?? ['R'],
    result.routines[2] ?? ['R'],
  );
}
