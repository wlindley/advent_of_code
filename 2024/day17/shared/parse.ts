import { ChronospatialProgram, VmRegisters, type ThreeBitValue } from './types';

const REGISTER_LINE_RE = /^Register ([ABC]):\s*(\d+)$/;
const PROGRAM_LINE_RE = /^Program:\s*(.+)$/;
const THREE_BIT_TOKEN_RE = /^[0-7]$/;

function parseRegisterLine(line: string, expectedName: 'A' | 'B' | 'C'): bigint {
  const match = REGISTER_LINE_RE.exec(line);
  if (match === null || match[1] !== expectedName) {
    throw new Error(`Expected "Register ${expectedName}: <non-negative integer>", got "${line}"`);
  }
  return BigInt(match[2]!);
}

function parseProgramLine(line: string): readonly ThreeBitValue[] {
  const match = PROGRAM_LINE_RE.exec(line);
  if (match === null) {
    throw new Error(`Expected "Program: <comma-separated 3-bit values>", got "${line}"`);
  }
  const tokens: ThreeBitValue[] = [];
  for (const part of match[1]!.split(',')) {
    const trimmed = part.trim();
    if (!THREE_BIT_TOKEN_RE.test(trimmed)) {
      throw new Error(`Invalid 3-bit program token "${trimmed}"`);
    }
    tokens.push(Number(trimmed) as ThreeBitValue);
  }
  return tokens;
}

/** Parses an AoC 2024 Day 17 register + program listing into a validated `ChronospatialProgram`. */
export function parseChronospatialInput(raw: string): ChronospatialProgram {
  const lines = raw
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length !== 4) {
    throw new Error(`Expected 4 non-empty lines (Registers A, B, C and Program), got ${lines.length}`);
  }

  const a = parseRegisterLine(lines[0]!, 'A');
  const b = parseRegisterLine(lines[1]!, 'B');
  const c = parseRegisterLine(lines[2]!, 'C');
  const instructions = parseProgramLine(lines[3]!);

  return new ChronospatialProgram(new VmRegisters(a, b, c), instructions);
}
