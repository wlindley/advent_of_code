import { Shape } from './rules';

export type OpponentCode = 'A' | 'B' | 'C';
export type ResponseCode = 'X' | 'Y' | 'Z';

const OPPONENT_SHAPES: Readonly<Record<OpponentCode, Shape>> = Object.freeze({
  A: Shape.Rock,
  B: Shape.Paper,
  C: Shape.Scissors,
});

function isOpponentCode(value: string): value is OpponentCode {
  return value === 'A' || value === 'B' || value === 'C';
}

function isResponseCode(value: string): value is ResponseCode {
  return value === 'X' || value === 'Y' || value === 'Z';
}

/** Immutable value object representing one parsed line of a Rock-Paper-Scissors strategy guide. */
export class StrategyRound {
  readonly roundNumber: number;
  readonly opponentCode: OpponentCode;
  readonly responseCode: ResponseCode;

  constructor(roundNumber: number, opponentCode: OpponentCode, responseCode: ResponseCode) {
    if (!Number.isSafeInteger(roundNumber) || roundNumber < 1) {
      throw new RangeError(`roundNumber must be a positive safe integer, got ${roundNumber}`);
    }
    if (!isOpponentCode(opponentCode)) {
      throw new RangeError(`opponentCode must be A, B, or C, got "${opponentCode}"`);
    }
    if (!isResponseCode(responseCode)) {
      throw new RangeError(`responseCode must be X, Y, or Z, got "${responseCode}"`);
    }
    this.roundNumber = roundNumber;
    this.opponentCode = opponentCode;
    this.responseCode = responseCode;
    Object.freeze(this);
  }

  get opponentShape(): Shape {
    return OPPONENT_SHAPES[this.opponentCode];
  }
}

function parseStrategyLine(rawLine: string, lineNumber: number, roundNumber: number): StrategyRound | null {
  const trimmed = rawLine.trim();
  if (trimmed.length === 0) return null;
  const tokens = trimmed.split(/\s+/);
  if (tokens.length !== 2) {
    throw new Error(`Line ${lineNumber}: expected 2 tokens, got "${trimmed}"`);
  }
  const [opponent, response] = tokens as [string, string];
  if (!isOpponentCode(opponent)) {
    throw new Error(`Line ${lineNumber}: expected opponent code A, B, or C, got "${opponent}"`);
  }
  if (!isResponseCode(response)) {
    throw new Error(`Line ${lineNumber}: expected response code X, Y, or Z, got "${response}"`);
  }
  return new StrategyRound(roundNumber, opponent, response);
}

/** Parses newline-delimited strategy guide rounds into frozen `StrategyRound` instances. */
export function parseStrategyGuide(raw: string): readonly StrategyRound[] {
  const lines = raw.split(/\r?\n/);
  const rounds: StrategyRound[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const round = parseStrategyLine(lines[i]!, i + 1, rounds.length + 1);
    if (round !== null) rounds.push(round);
  }
  if (rounds.length === 0) {
    throw new Error('Strategy guide must contain at least one round');
  }
  return Object.freeze(rounds);
}
