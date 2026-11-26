import { Crate, MoveInstruction, SupplyProcedure } from './model';

const CRATE_SLOT_RE = /^\[([A-Z])\]$/;
const MOVE_LINE_RE = /^move (\d+) from (\d+) to (\d+)$/;

interface RawSections {
  readonly diagramLines: readonly string[];
  readonly moveLines: readonly string[];
  readonly moveStartLine: number;
}

function splitSections(raw: string): RawSections {
  // Never trim raw input or diagram lines: leading whitespace encodes empty left columns.
  const lines = raw.split(/\r?\n/);
  const blankIndex = lines.findIndex((line) => line.trim() === '');
  if (blankIndex < 1) {
    throw new Error('Input must separate the crate diagram and move list with a blank line');
  }
  const diagramLines = lines.slice(0, blankIndex);
  if (diagramLines.length < 2) {
    throw new Error('Crate diagram must include at least one crate row above stack numbers');
  }
  return {
    diagramLines,
    moveLines: lines.slice(blankIndex + 1),
    moveStartLine: blankIndex + 2,
  };
}

function parseStackCount(labelLine: string): number {
  const tokens = labelLine.trim().split(/\s+/);
  for (let i = 0; i < tokens.length; i += 1) {
    if (tokens[i] !== String(i + 1)) {
      throw new Error(`Expected sequential stack number ${i + 1}, got "${tokens[i]}"`);
    }
  }
  return tokens.length;
}

function parseCrateSlot(token: string, lineNumber: number, stackNumber: number): Crate | null {
  if (token.trim() === '') return null;
  const match = CRATE_SLOT_RE.exec(token);
  if (!match) {
    throw new Error(`Invalid crate token "${token}" at line ${lineNumber}, stack ${stackNumber}`);
  }
  return new Crate(match[1]!);
}

function parseDiagramRow(row: string, stackCount: number, lineNumber: number): readonly (Crate | null)[] {
  if (row.trimEnd().length > stackCount * 4 - 1) {
    throw new Error(`Diagram row at line ${lineNumber} exceeds width for ${stackCount} stacks`);
  }
  const slots: (Crate | null)[] = [];
  for (let k = 0; k < stackCount; k += 1) {
    const offset = k * 4;
    if (k > 0) {
      const sep = row[offset - 1];
      if (sep !== undefined && sep !== ' ') {
        throw new Error(`Expected space between stacks ${k} and ${k + 1} at line ${lineNumber}`);
      }
    }
    slots.push(parseCrateSlot(row.slice(offset, offset + 3), lineNumber, k + 1));
  }
  return slots;
}

function parseInitialStacks(diagramLines: readonly string[]): readonly (readonly Crate[])[] {
  const stackCount = parseStackCount(diagramLines.at(-1)!);
  const stacks: Crate[][] = Array.from({ length: stackCount }, () => []);
  const closed = new Array<boolean>(stackCount).fill(false);

  for (let rowIdx = diagramLines.length - 2; rowIdx >= 0; rowIdx -= 1) {
    const slots = parseDiagramRow(diagramLines[rowIdx]!, stackCount, rowIdx + 1);
    for (let k = 0; k < stackCount; k += 1) {
      const crate = slots[k]!;
      if (crate === null) {
        closed[k] = true;
        continue;
      }
      if (closed[k]) {
        throw new Error(`Floating crate [${crate.label}] above gap in stack ${k + 1} at line ${rowIdx + 1}`);
      }
      stacks[k]!.push(crate);
    }
  }
  return stacks;
}

function parseMoves(moveLines: readonly string[], startLineNumber: number): readonly MoveInstruction[] {
  const moves: MoveInstruction[] = [];
  for (let i = 0; i < moveLines.length; i += 1) {
    const line = moveLines[i]!.trim();
    if (line === '') continue;
    const match = MOVE_LINE_RE.exec(line);
    if (!match) {
      throw new Error(`Invalid move instruction at line ${startLineNumber + i}: "${line}"`);
    }
    moves.push(new MoveInstruction(Number(match[1]!), Number(match[2]!), Number(match[3]!)));
  }
  if (moves.length === 0) {
    throw new Error('Supply procedure must contain at least one move instruction');
  }
  return moves;
}

/** Parses an AoC Day 5 diagram + move list into an immutable SupplyProcedure. */
export function parseSupplyProcedure(raw: string): SupplyProcedure {
  const { diagramLines, moveLines, moveStartLine } = splitSections(raw);
  const stacks = parseInitialStacks(diagramLines);
  const moves = parseMoves(moveLines, moveStartLine);
  return new SupplyProcedure(stacks, moves);
}
