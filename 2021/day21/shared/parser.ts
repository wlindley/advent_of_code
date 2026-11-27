import { DiracDiceInput, type PlayerId } from './types';

function parsePlayerLine(line: string, player: PlayerId): number {
  const prefix = `Player ${player} starting position:`;
  const trimmed = line.trim();
  if (!trimmed.startsWith(prefix)) {
    throw new Error(`Expected "${prefix} <n>" for player ${player}, got "${trimmed}"`);
  }
  const valueText = trimmed.slice(prefix.length).trim();
  if (valueText.length === 0) {
    throw new Error(`Missing starting position value for player ${player}`);
  }
  return Number(valueText);
}

/** Parses 2-line AoC Dirac Dice starting position input into a validated DiracDiceInput. */
export function parseDiracDice(raw: string): DiracDiceInput {
  const trimmed = raw.trim();
  const lines = trimmed.length === 0 ? [] : trimmed.split(/\r?\n/);
  if (lines.length !== 2) {
    throw new Error(`Expected 2 starting position lines, got ${lines.length}`);
  }
  const player1 = parsePlayerLine(lines[0]!, 1);
  const player2 = parsePlayerLine(lines[1]!, 2);
  return new DiracDiceInput(player1, player2);
}
