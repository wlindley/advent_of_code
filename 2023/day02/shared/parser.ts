import { CubeBag, isCubeColor, type CubeColor } from './cubeBag';
import { GameRecord } from './gameRecord';

const GAME_LINE_RE = /^Game\s+(\d+):\s*(.+)$/;
const CLAUSE_RE = /^(\d+)\s+(\S+)$/;

interface CubeClause {
  readonly color: CubeColor;
  readonly count: number;
}

function parseCubeClause(rawClause: string): CubeClause {
  const trimmed = rawClause.trim();
  const match = CLAUSE_RE.exec(trimmed);
  if (!match) {
    throw new SyntaxError(`Invalid cube clause: "${trimmed}"`);
  }
  const colorToken = match[2]!;
  if (!isCubeColor(colorToken)) {
    throw new SyntaxError(`Unknown cube color: "${colorToken}"`);
  }
  return { color: colorToken, count: Number(match[1]!) };
}

function parseReveal(segment: string): CubeBag {
  const trimmed = segment.trim();
  if (trimmed.length === 0) {
    throw new SyntaxError('Reveal segment cannot be empty');
  }
  const counts: Record<CubeColor, number> = { red: 0, green: 0, blue: 0 };
  const seen = new Set<CubeColor>();
  for (const rawClause of trimmed.split(',')) {
    const { color, count } = parseCubeClause(rawClause);
    if (seen.has(color)) {
      throw new SyntaxError(`Duplicate color "${color}" in reveal`);
    }
    seen.add(color);
    counts[color] = count;
  }
  return new CubeBag(counts.red, counts.green, counts.blue);
}

/** Parses a single `Game <id>: <reveals>` line into a frozen {@link GameRecord}. */
export function parseGameLine(line: string): GameRecord {
  const trimmed = line.trim();
  const match = GAME_LINE_RE.exec(trimmed);
  if (!match) {
    throw new SyntaxError(`Invalid game line: "${trimmed}"`);
  }
  const id = Number(match[1]!);
  const reveals = match[2]!.split(';').map(parseReveal);
  return new GameRecord(id, reveals);
}

/** Parses multiline Cube Conundrum input into a frozen array of {@link GameRecord}. */
export function parseGames(raw: string): readonly GameRecord[] {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    throw new SyntaxError('Puzzle input cannot be empty');
  }
  return Object.freeze(trimmed.split(/\r?\n/).map(parseGameLine));
}
