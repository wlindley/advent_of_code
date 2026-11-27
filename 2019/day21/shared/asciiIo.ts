import type { IoChannel } from '../../shared/intcode';

const MAX_ASCII_CODE = 127;
const MAX_ASCII_BIGINT = 127n;

export interface SpringdroidOutput {
  readonly asciiLog: string;
  readonly hullDamage: bigint | null;
}

/** O(1) cursor-indexed ASCII & BigInt I/O channel for Day 21 Springdroid Intcode VMs. */
export class SpringdroidAsciiIo implements IoChannel {
  private readonly inputs: bigint[] = [];
  private inputCursor = 0;
  private readonly outputs: bigint[] = [];
  private outputCursor = 0;

  get pendingInputCount(): number {
    return this.inputs.length - this.inputCursor;
  }

  get outputCount(): number {
    return this.outputs.length;
  }

  pushInput(value: bigint): void {
    this.inputs.push(value);
  }

  pushAscii(text: string): void {
    for (let i = 0; i < text.length; i += 1) {
      const code = text.charCodeAt(i);
      if (code > MAX_ASCII_CODE) {
        throw new RangeError(`Non-ASCII code point ${code} at index ${i}`);
      }
      this.inputs.push(BigInt(code));
    }
  }

  readInput(): bigint | null {
    if (this.inputCursor >= this.inputs.length) {
      return null;
    }
    const value = this.inputs[this.inputCursor]!;
    this.inputCursor += 1;
    return value;
  }

  writeOutput(value: bigint): void {
    this.outputs.push(value);
  }

  drainSpringdroidOutput(): SpringdroidOutput {
    const chars: string[] = [];
    let hullDamage: bigint | null = null;
    while (this.outputCursor < this.outputs.length) {
      const value = this.outputs[this.outputCursor]!;
      this.outputCursor += 1;
      if (value < 0n) {
        throw new RangeError(`Negative output value ${value}`);
      }
      if (value <= MAX_ASCII_BIGINT) {
        chars.push(String.fromCharCode(Number(value)));
      } else if (hullDamage !== null) {
        throw new Error('Multiple hull damage values in output');
      } else {
        hullDamage = value;
      }
    }
    return Object.freeze({ asciiLog: chars.join(''), hullDamage });
  }

  snapshotInputs(): readonly bigint[] {
    return Object.freeze(this.inputs.slice(this.inputCursor));
  }

  snapshotOutputs(): readonly bigint[] {
    return Object.freeze([...this.outputs]);
  }
}
