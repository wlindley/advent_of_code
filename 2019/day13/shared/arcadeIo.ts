import type { IoChannel } from '../../shared/intcode';

/** O(1) cursor-draining bidirectional I/O channel for the Intcode arcade cabinet. */
export class ArcadeIoChannel implements IoChannel {
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

  takeOutput(): bigint | null {
    if (this.outputCursor >= this.outputs.length) {
      return null;
    }
    const value = this.outputs[this.outputCursor]!;
    this.outputCursor += 1;
    return value;
  }

  snapshotInputs(): readonly bigint[] {
    return Object.freeze(this.inputs.slice(this.inputCursor));
  }

  snapshotOutputs(): readonly bigint[] {
    return Object.freeze([...this.outputs]);
  }
}
