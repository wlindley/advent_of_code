export type CommandDirection = 'forward' | 'down' | 'up';

export interface SubmarineCommand {
  readonly direction: CommandDirection;
  readonly units: bigint;
}

const VALID_DIRECTIONS: ReadonlySet<string> = new Set(['forward', 'down', 'up']);
const DIGITS_PATTERN = /^\d+$/;

/** Type guard verifying a token is a valid submarine command direction. */
export function isCommandDirection(token: string): token is CommandDirection {
  return VALID_DIRECTIONS.has(token);
}

/** Immutable sequence of validated submarine navigation commands. */
export class SubmarineCourse {
  readonly commands: readonly SubmarineCommand[];

  constructor(commands: readonly SubmarineCommand[]) {
    if (commands.length === 0) {
      throw new RangeError('Submarine course must contain at least one command');
    }
    const copied: SubmarineCommand[] = [];
    for (const command of commands) {
      if (command.units < 0n) {
        throw new RangeError(`Command units must be non-negative, got ${command.units}`);
      }
      copied.push(Object.freeze({ direction: command.direction, units: command.units }));
    }
    this.commands = Object.freeze(copied);
    Object.freeze(this);
  }

  get count(): number {
    return this.commands.length;
  }

  commandAt(index: number): SubmarineCommand {
    if (!Number.isInteger(index) || index < 0 || index >= this.commands.length) {
      throw new RangeError(`Command index out of bounds: ${index}`);
    }
    return this.commands[index]!;
  }
}

/** Parses newline-delimited `<direction> <units>` lines into an immutable SubmarineCourse. */
export function parseSubmarineCourse(raw: string): SubmarineCourse {
  const commands: SubmarineCommand[] = [];
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0) continue;
    const parts = trimmed.split(/\s+/);
    if (parts.length !== 2) {
      throw new SyntaxError(`Invalid command line: "${trimmed}"`);
    }
    const direction = parts[0]!;
    const unitToken = parts[1]!;
    if (!isCommandDirection(direction)) {
      throw new SyntaxError(`Unknown command direction: "${direction}"`);
    }
    if (!DIGITS_PATTERN.test(unitToken)) {
      throw new SyntaxError(`Invalid command units: "${unitToken}"`);
    }
    commands.push({ direction, units: BigInt(unitToken) });
  }
  return new SubmarineCourse(commands);
}
