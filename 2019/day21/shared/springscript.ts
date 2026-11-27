export const MAX_SPRINGSCRIPT_INSTRUCTIONS = 15;
export const SENSOR_ORDER = Object.freeze(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const);

export type SpringdroidMode = 'WALK' | 'RUN';
export type SpringscriptOp = 'AND' | 'OR' | 'NOT';
export type WalkSensorRegister = 'A' | 'B' | 'C' | 'D';
export type ExtendedSensorRegister = 'E' | 'F' | 'G' | 'H' | 'I';
export type SensorRegister = WalkSensorRegister | ExtendedSensorRegister;
export type WritableRegister = 'T' | 'J';
export type ReadableRegister = SensorRegister | WritableRegister;
export type SensorWindow = Readonly<Record<SensorRegister, boolean>>;

export interface SpringscriptInstruction {
  readonly op: SpringscriptOp;
  readonly x: ReadableRegister;
  readonly y: WritableRegister;
}

export interface SpringscriptStep {
  readonly index: number;
  readonly instruction: SpringscriptInstruction;
  readonly tAfter: boolean;
  readonly jAfter: boolean;
}

export interface SpringscriptEvaluation {
  readonly registerT: boolean;
  readonly registerJ: boolean;
  readonly steps: readonly SpringscriptStep[];
}

const WALK_READABLE_REGISTERS: ReadonlySet<ReadableRegister> = new Set(['A', 'B', 'C', 'D', 'T', 'J']);

const OP_HANDLERS: Record<SpringscriptOp, (x: boolean, y: boolean) => boolean> = {
  AND: (x, y) => x && y,
  OR: (x, y) => x || y,
  NOT: (x) => !x,
};

/** Formats a single Springscript instruction as an uppercase ASCII statement. */
export function formatSpringscriptInstruction(inst: SpringscriptInstruction): string {
  return `${inst.op} ${inst.x} ${inst.y}`;
}

function readRegister(reg: ReadableRegister, sensors: SensorWindow, t: boolean, j: boolean): boolean {
  if (reg === 'T') return t;
  if (reg === 'J') return j;
  return sensors[reg];
}

function freezeValidatedInstructions(
  mode: SpringdroidMode,
  instructions: readonly SpringscriptInstruction[],
): readonly SpringscriptInstruction[] {
  if (instructions.length > MAX_SPRINGSCRIPT_INSTRUCTIONS) {
    throw new RangeError(
      `Springscript supports at most ${MAX_SPRINGSCRIPT_INSTRUCTIONS} instructions, got ${instructions.length}`,
    );
  }
  const frozen: SpringscriptInstruction[] = [];
  for (const inst of instructions) {
    if (mode === 'WALK' && !WALK_READABLE_REGISTERS.has(inst.x)) {
      throw new RangeError(`Register "${inst.x}" is only available in RUN mode`);
    }
    frozen.push(Object.freeze({ op: inst.op, x: inst.x, y: inst.y }));
  }
  return Object.freeze(frozen);
}

/** Validated, immutable Springscript program for WALK or RUN mode. */
export class SpringscriptProgram {
  readonly mode: SpringdroidMode;
  readonly instructions: readonly SpringscriptInstruction[];

  constructor(mode: SpringdroidMode, instructions: readonly SpringscriptInstruction[]) {
    this.mode = mode;
    this.instructions = freezeValidatedInstructions(mode, instructions);
    Object.freeze(this);
  }

  get length(): number {
    return this.instructions.length;
  }

  toAscii(): string {
    if (this.instructions.length === 0) {
      return `${this.mode}\n`;
    }
    const lines: string[] = [];
    for (const inst of this.instructions) {
      lines.push(formatSpringscriptInstruction(inst));
    }
    return `${lines.join('\n')}\n${this.mode}\n`;
  }

  evaluate(sensors: SensorWindow): SpringscriptEvaluation {
    let t = false;
    let j = false;
    const steps: SpringscriptStep[] = [];
    for (let i = 0; i < this.instructions.length; i += 1) {
      const inst = this.instructions[i]!;
      const xVal = readRegister(inst.x, sensors, t, j);
      const yVal = inst.y === 'T' ? t : j;
      const result = OP_HANDLERS[inst.op](xVal, yVal);
      if (inst.y === 'T') t = result;
      else j = result;
      steps.push(Object.freeze({ index: i, instruction: inst, tAfter: t, jAfter: j }));
    }
    return Object.freeze({ registerT: t, registerJ: j, steps: Object.freeze(steps) });
  }
}
