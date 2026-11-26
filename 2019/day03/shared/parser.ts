import {
  WireSegment,
  type Direction,
  type GridPoint,
  type WireMove,
  type WirePair,
} from './types';

const MOVE_PATTERN = /^([UDLR])([1-9]\d*)$/;

/** Parses a comma-separated wire path string into validated directional moves. */
export function parseWireMoves(line: string): readonly WireMove[] {
  const trimmed = line.trim();
  if (trimmed.length === 0) {
    throw new Error('Wire path must not be empty');
  }
  const tokens = trimmed.split(',');
  const moves: WireMove[] = [];
  for (const rawToken of tokens) {
    const token = rawToken.trim();
    const match = MOVE_PATTERN.exec(token);
    if (match === null) {
      throw new Error(`Invalid wire move "${token}": expected [UDLR] followed by positive integer`);
    }
    moves.push(Object.freeze({
      direction: match[1] as Direction,
      distance: BigInt(match[2]!),
    }));
  }
  return Object.freeze(moves);
}

/** Converts directional wire moves into consecutive anchored segments starting at (0, 0). */
export function buildWireSegments(moves: readonly WireMove[]): readonly WireSegment[] {
  const segments: WireSegment[] = [];
  let cursor: GridPoint = { x: 0n, y: 0n };
  let steps = 0n;
  for (let i = 0; i < moves.length; i += 1) {
    const move = moves[i]!;
    const segment = new WireSegment(i, cursor, move.direction, move.distance, steps);
    segments.push(segment);
    cursor = segment.end;
    steps = segment.endSteps;
  }
  return Object.freeze(segments);
}

/** Parses raw puzzle input containing exactly two non-empty wire path lines. */
export function parseWirePair(raw: string): WirePair {
  const lines: string[] = [];
  for (const rawLine of raw.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (trimmed.length > 0) {
      lines.push(trimmed);
    }
  }
  if (lines.length !== 2) {
    throw new Error(`Expected exactly 2 wire paths, got ${lines.length}`);
  }
  const first = buildWireSegments(parseWireMoves(lines[0]!));
  const second = buildWireSegments(parseWireMoves(lines[1]!));
  return Object.freeze({ first, second });
}
