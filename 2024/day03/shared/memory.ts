import {
  ControlInstruction,
  MAX_OPERAND_DIGITS,
  MulInstruction,
  type MemoryInstruction,
} from './instruction';

interface DigitScan {
  readonly value: number;
  readonly end: number;
}

interface ScanStep {
  readonly instruction: MemoryInstruction | null;
  readonly nextPos: number;
}

function isAsciiDigit(code: number): boolean {
  return code >= 48 && code <= 57;
}

function matchLiteral(raw: string, start: number, literal: string): number {
  for (let i = 0; i < literal.length; i += 1) {
    if (raw.charCodeAt(start + i) !== literal.charCodeAt(i)) return start + i;
  }
  return start + literal.length;
}

function scanOperand(raw: string, start: number): DigitScan {
  let value = 0;
  let end = start;
  const limit = start + MAX_OPERAND_DIGITS;
  while (end < limit) {
    const code = raw.charCodeAt(end);
    if (!isAsciiDigit(code)) break;
    value = value * 10 + (code - 48);
    end += 1;
  }
  return { value, end };
}

function tryScanMul(raw: string, start: number): ScanStep {
  const afterPrefix = matchLiteral(raw, start, 'mul(');
  if (afterPrefix < start + 4) {
    return { instruction: null, nextPos: Math.max(start + 1, afterPrefix) };
  }
  const first = scanOperand(raw, afterPrefix);
  if (first.end === afterPrefix || raw.charCodeAt(first.end) !== 44) {
    return { instruction: null, nextPos: first.end };
  }
  const secondStart = first.end + 1;
  const second = scanOperand(raw, secondStart);
  if (second.end === secondStart || raw.charCodeAt(second.end) !== 41) {
    return { instruction: null, nextPos: second.end };
  }
  const end = second.end + 1;
  return { instruction: new MulInstruction(first.value, second.value, start, end), nextPos: end };
}

function tryScanControl(raw: string, start: number): ScanStep {
  const afterDo = matchLiteral(raw, start, 'do');
  if (afterDo < start + 2) {
    return { instruction: null, nextPos: Math.max(start + 1, afterDo) };
  }
  const nextCode = raw.charCodeAt(afterDo);
  if (nextCode === 40 && raw.charCodeAt(afterDo + 1) === 41) {
    return { instruction: new ControlInstruction('do', start, afterDo + 2), nextPos: afterDo + 2 };
  }
  if (nextCode === 40) {
    return { instruction: null, nextPos: afterDo + 1 };
  }
  if (nextCode === 110) {
    const afterDont = matchLiteral(raw, afterDo + 1, "'t()");
    if (afterDont === afterDo + 5) {
      return { instruction: new ControlInstruction('dont', start, afterDont), nextPos: afterDont };
    }
    return { instruction: null, nextPos: afterDont };
  }
  return { instruction: null, nextPos: afterDo };
}

function validateInstructions(
  rawLength: number,
  instructions: readonly MemoryInstruction[],
): readonly MemoryInstruction[] {
  let prevEnd = 0;
  for (let i = 0; i < instructions.length; i += 1) {
    const inst = instructions[i]!;
    if (inst.start < prevEnd || inst.end > rawLength) {
      throw new RangeError(`Instruction #${i} span [${inst.start}, ${inst.end}) is out of order or bounds`);
    }
    prevEnd = inst.end;
  }
  return Object.freeze([...instructions]);
}

function isMulInstruction(inst: MemoryInstruction): inst is MulInstruction {
  return inst.kind === 'mul';
}

/** Immutable parsed corrupted memory stream with non-overlapping ordered instructions. */
export class ParsedMemory {
  readonly raw: string;
  readonly instructions: readonly MemoryInstruction[];

  constructor(raw: string, instructions: readonly MemoryInstruction[]) {
    this.raw = raw;
    this.instructions = validateInstructions(raw.length, instructions);
    Object.freeze(this);
  }

  get mulInstructions(): readonly MulInstruction[] {
    return Object.freeze(this.instructions.filter(isMulInstruction));
  }
}

/** Scans a continuous corrupted memory stream into validated `mul`, `do`, and `don't` instructions. */
export function parseCorruptedMemory(raw: string): ParsedMemory {
  const instructions: MemoryInstruction[] = [];
  let pos = 0;
  while (pos < raw.length) {
    const code = raw.charCodeAt(pos);
    if (code === 109) {
      const step = tryScanMul(raw, pos);
      if (step.instruction !== null) instructions.push(step.instruction);
      pos = step.nextPos;
    } else if (code === 100) {
      const step = tryScanControl(raw, pos);
      if (step.instruction !== null) instructions.push(step.instruction);
      pos = step.nextPos;
    } else {
      pos += 1;
    }
  }
  return new ParsedMemory(raw, instructions);
}
