export const MOVE_DIRECTION = Object.freeze({ U: 'U', D: 'D', L: 'L', R: 'R' } as const);
export type MoveDirection = (typeof MOVE_DIRECTION)[keyof typeof MOVE_DIRECTION];

const DIRECTION_DELTAS: Readonly<Record<MoveDirection, readonly [number, number]>> = Object.freeze({
  U: Object.freeze([0, 1] as const),
  D: Object.freeze([0, -1] as const),
  L: Object.freeze([-1, 0] as const),
  R: Object.freeze([1, 0] as const),
});

const COMMAND_LINE_RE = /^([UDLR]) ([1-9]\d*)$/;

function requireSafeInt(value: number, label: string): number {
  if (!Number.isSafeInteger(value)) {
    throw new RangeError(`${label} must be a safe integer, got ${value}`);
  }
  return value;
}

/** Immutable 2D integer lattice point in Y-up coordinates. */
export class GridPoint {
  static readonly ORIGIN = new GridPoint(0, 0);
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = requireSafeInt(x, 'x');
    this.y = requireSafeInt(y, 'y');
    Object.freeze(this);
  }

  equals(other: GridPoint): boolean {
    return this.x === other.x && this.y === other.y;
  }
}

/** Immutable axis-aligned bounding box over integer lattice points. */
export class GridBounds {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;

  constructor(minX: number, maxX: number, minY: number, maxY: number) {
    this.minX = requireSafeInt(minX, 'minX');
    this.maxX = requireSafeInt(maxX, 'maxX');
    this.minY = requireSafeInt(minY, 'minY');
    this.maxY = requireSafeInt(maxY, 'maxY');
    if (this.minX > this.maxX) throw new RangeError(`minX (${this.minX}) > maxX (${this.maxX})`);
    if (this.minY > this.maxY) throw new RangeError(`minY (${this.minY}) > maxY (${this.maxY})`);
    Object.freeze(this);
  }

  get width(): number { return this.maxX - this.minX + 1; }
  get height(): number { return this.maxY - this.minY + 1; }
  get area(): number { return this.width * this.height; }
}

/** Single head-motion instruction (`U|D|L|R` with positive step count). */
export class MotionCommand {
  readonly direction: MoveDirection;
  readonly steps: number;

  constructor(direction: MoveDirection, steps: number) {
    if (!Object.prototype.hasOwnProperty.call(DIRECTION_DELTAS, direction)) {
      throw new Error(`Invalid move direction: "${String(direction)}"`);
    }
    if (!Number.isSafeInteger(steps) || steps < 1) {
      throw new RangeError(`steps must be a positive safe integer, got ${steps}`);
    }
    this.direction = direction;
    this.steps = steps;
    Object.freeze(this);
  }

  get dx(): number { return DIRECTION_DELTAS[this.direction][0]; }
  get dy(): number { return DIRECTION_DELTAS[this.direction][1]; }

  static parse(line: string, lineNumber: number): MotionCommand {
    const match = COMMAND_LINE_RE.exec(line);
    if (!match) throw new Error(`Invalid motion command on line ${lineNumber}: "${line}"`);
    return new MotionCommand(match[1] as MoveDirection, Number(match[2]!));
  }
}

/** Validated, non-empty sequence of head-motion commands starting at the origin. */
export class MotionPlan {
  readonly commands: readonly MotionCommand[];

  constructor(commands: readonly MotionCommand[]) {
    if (commands.length === 0) throw new RangeError('Motion plan must contain at least one command');
    this.commands = Object.freeze([...commands]);
    Object.freeze(this);
  }

  get commandCount(): number { return this.commands.length; }

  get totalSteps(): number {
    let total = 0;
    for (const cmd of this.commands) total += cmd.steps;
    return total;
  }

  computeBounds(): GridBounds {
    let x = 0, y = 0, minX = 0, maxX = 0, minY = 0, maxY = 0;
    for (const cmd of this.commands) {
      x += cmd.dx * cmd.steps;
      y += cmd.dy * cmd.steps;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return new GridBounds(minX, maxX, minY, maxY);
  }

  static parse(raw: string): MotionPlan {
    const normalized = raw.replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, '');
    if (normalized.length === 0) throw new Error('Motion plan input must not be empty');
    const commands = normalized.split('\n').map((line, i) => MotionCommand.parse(line, i + 1));
    return new MotionPlan(commands);
  }
}
