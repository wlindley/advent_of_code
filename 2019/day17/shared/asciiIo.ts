import type { IoChannel } from '../../shared/intcode';

const MAX_ASCII_CODE = 127;
const MAX_ASCII_BIGINT = 127n;

/** Output payload drained from an ASCII-capable dust collection Intcode run. */
export interface AsciiDustOutput {
  readonly asciiLog: string;
  readonly dust: bigint;
}

/** O(1) cursor-draining ASCII & BigInt I/O channel for Day 17 Intcode VMs. */
export class AsciiIoChannel implements IoChannel {
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

  get pendingOutputCount(): number {
    return this.outputs.length - this.outputCursor;
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

  drainAscii(): string {
    const chars: string[] = [];
    while (this.outputCursor < this.outputs.length) {
      const value = this.outputs[this.outputCursor]!;
      this.outputCursor += 1;
      if (value < 0n || value > MAX_ASCII_BIGINT) {
        throw new RangeError(`Non-ASCII output value ${value}`);
      }
      chars.push(String.fromCharCode(Number(value)));
    }
    return chars.join('');
  }

  drainDustOutput(): AsciiDustOutput {
    const chars: string[] = [];
    let dust: bigint | null = null;
    while (this.outputCursor < this.outputs.length) {
      const value = this.outputs[this.outputCursor]!;
      this.outputCursor += 1;
      if (value < 0n) {
        throw new RangeError(`Negative output value ${value}`);
      }
      if (value <= MAX_ASCII_BIGINT) {
        chars.push(String.fromCharCode(Number(value)));
      } else if (dust !== null) {
        throw new Error('Multiple dust values in output');
      } else {
        dust = value;
      }
    }
    if (dust === null) {
      throw new Error('Missing dust output value');
    }
    return Object.freeze({ asciiLog: chars.join(''), dust });
  }

  snapshotInputs(): readonly bigint[] {
    return Object.freeze(this.inputs.slice(this.inputCursor));
  }

  snapshotOutputs(): readonly bigint[] {
    return Object.freeze([...this.outputs]);
  }
}
