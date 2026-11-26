import { type ClawConfig, Vector2D } from './types';

const BUTTON_A_RE = /^Button A: X\+(\d+), Y\+(\d+)$/;
const BUTTON_B_RE = /^Button B: X\+(\d+), Y\+(\d+)$/;
const PRIZE_RE = /^Prize: X=(\d+), Y=(\d+)$/;

function assertPositiveDelta(label: string, vec: Vector2D): void {
  if (vec.x <= 0n || vec.y <= 0n) {
    throw new RangeError(`${label} must have positive deltas, got (${vec.x}, ${vec.y})`);
  }
}

/** Immutable claw machine specification with strictly positive button deltas and non-negative prize. */
export class ClawMachine {
  readonly buttonA: Vector2D;
  readonly buttonB: Vector2D;
  readonly prize: Vector2D;

  constructor(buttonA: Vector2D, buttonB: Vector2D, prize: Vector2D) {
    assertPositiveDelta('buttonA', buttonA);
    assertPositiveDelta('buttonB', buttonB);
    if (prize.x < 0n || prize.y < 0n) {
      throw new RangeError(`prize must be non-negative, got (${prize.x}, ${prize.y})`);
    }
    this.buttonA = buttonA;
    this.buttonB = buttonB;
    this.prize = prize;
    Object.freeze(this);
  }

  /** 2D determinant `buttonA × buttonB`; zero indicates collinear button vectors. */
  get determinant(): bigint {
    return this.buttonA.cross(this.buttonB);
  }

  /** Whether button A and button B are linearly dependent (parallel rays). */
  get isCollinear(): boolean {
    return this.determinant === 0n;
  }

  /** Computes the effective target prize vector under `config`. */
  targetPrize(config: ClawConfig): Vector2D {
    return this.prize.translate(config.prizeOffset);
  }
}

function parseVectorLine(line: string, pattern: RegExp, label: string): Vector2D {
  const match = pattern.exec(line);
  if (!match) {
    throw new Error(`Invalid ${label} line: "${line}"`);
  }
  return new Vector2D(BigInt(match[1]!), BigInt(match[2]!));
}

function parseBlock(block: string, index: number): ClawMachine {
  const lines = block.split('\n');
  if (lines.length !== 3) {
    throw new Error(`Machine block #${index + 1} must have 3 lines, got ${lines.length}`);
  }
  const a = parseVectorLine(lines[0]!.trim(), BUTTON_A_RE, 'Button A');
  const b = parseVectorLine(lines[1]!.trim(), BUTTON_B_RE, 'Button B');
  const p = parseVectorLine(lines[2]!.trim(), PRIZE_RE, 'Prize');
  return new ClawMachine(a, b, p);
}

/** Parses blank-line-separated claw machine blocks into a frozen array of `ClawMachine`s. */
export function parseClawMachines(raw: string): readonly ClawMachine[] {
  const normalized = raw.replace(/\r\n/g, '\n').trim();
  if (normalized.length === 0) {
    throw new Error('Claw machine input cannot be empty');
  }
  const blocks = normalized.split(/\n\s*\n/);
  const machines: ClawMachine[] = [];
  for (let i = 0; i < blocks.length; i += 1) {
    machines.push(parseBlock(blocks[i]!, i));
  }
  return Object.freeze(machines);
}
