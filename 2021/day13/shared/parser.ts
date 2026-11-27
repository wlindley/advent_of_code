import { DotSheet, FoldInstruction, OrigamiManual, type Dot, type FoldAxis } from './models';

const DOT_PATTERN = /^(\d+),(\d+)$/;
const FOLD_PATTERN = /^fold along ([xy])=(\d+)$/;

function parseDotLine(line: string, lineIndex: number): Dot {
  const match = DOT_PATTERN.exec(line.trim());
  if (match === null) {
    throw new Error(`Invalid dot line at #${lineIndex + 1}: ${JSON.stringify(line)}`);
  }
  return { x: Number(match[1]!), y: Number(match[2]!) };
}

function parseFoldLine(line: string, lineIndex: number): FoldInstruction {
  const match = FOLD_PATTERN.exec(line.trim());
  if (match === null) {
    throw new Error(`Invalid fold line at #${lineIndex + 1}: ${JSON.stringify(line)}`);
  }
  return new FoldInstruction(match[1]! as FoldAxis, Number(match[2]!));
}

/** Parses raw transparent origami input into an immutable `OrigamiManual`. */
export function parseOrigamiManual(raw: string): OrigamiManual {
  const normalized = raw.replace(/\r\n?/g, '\n').trim();
  if (normalized.length === 0) throw new Error('Input must not be empty');
  const sections = normalized.split(/\n\s*\n/);
  if (sections.length !== 2) {
    throw new Error(`Expected 2 input sections separated by a blank line, got ${sections.length}`);
  }
  const dots = sections[0]!.split('\n').map(parseDotLine);
  const folds = sections[1]!.split('\n').map(parseFoldLine);
  return new OrigamiManual(new DotSheet(dots), folds);
}
