import { BOARD_SIZE, BingoBoard, BingoGame } from './types';

function parseNonNegSafeInt(token: string, label: string): number {
  if (!/^\d+$/.test(token)) {
    throw new SyntaxError(`${label} must be a non-negative integer, got "${token}"`);
  }
  const value = Number(token);
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} exceeds MAX_SAFE_INTEGER: "${token}"`);
  }
  return value;
}

function parseDraws(headerBlock: string): number[] {
  const tokens = headerBlock.split(',');
  const draws: number[] = [];
  for (let i = 0; i < tokens.length; i += 1) {
    draws.push(parseNonNegSafeInt(tokens[i]!.trim(), `draw[${i}]`));
  }
  return draws;
}

function parseBoard(id: number, block: string): BingoBoard {
  const lines = block.split('\n');
  if (lines.length !== BOARD_SIZE) {
    throw new RangeError(`Board ${id} must have ${BOARD_SIZE} rows, got ${lines.length}`);
  }
  const cells: number[] = [];
  for (let r = 0; r < lines.length; r += 1) {
    const tokens = lines[r]!.trim().split(/\s+/);
    if (tokens.length !== BOARD_SIZE) {
      throw new RangeError(`Board ${id} row ${r} must have ${BOARD_SIZE} columns, got ${tokens.length}`);
    }
    for (let c = 0; c < tokens.length; c += 1) {
      cells.push(parseNonNegSafeInt(tokens[c]!, `board[${id}][${r},${c}]`));
    }
  }
  return new BingoBoard(id, cells);
}

/** Parses raw Giant Squid input into an immutable, domain-validated BingoGame. */
export function parseBingoGame(raw: string): BingoGame {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (normalized.length === 0) {
    throw new RangeError('Bingo input cannot be empty');
  }
  const blocks = normalized.split(/\n\s*\n/);
  if (blocks.length < 2) {
    throw new RangeError('Bingo input requires a draw line and at least one 5x5 board');
  }
  const draws = parseDraws(blocks[0]!);
  const boards: BingoBoard[] = [];
  for (let i = 1; i < blocks.length; i += 1) {
    boards.push(parseBoard(i - 1, blocks[i]!.trim()));
  }
  return new BingoGame(draws, boards);
}
