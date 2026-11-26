/** Streaming I/O channel contract exposed to an Intcode VM instance. */
export interface IoChannel {
  readonly pendingInputCount: number;
  readonly outputCount: number;
  pushInput(value: bigint): void;
  readInput(): bigint | null;
  writeOutput(value: bigint): void;
  snapshotInputs(): readonly bigint[];
  snapshotOutputs(): readonly bigint[];
}

/** O(1) cursor-indexed FIFO input queue and append-only output buffer. */
export class BufferedIoChannel implements IoChannel {
  private readonly inputs: bigint[];
  private inputCursor = 0;
  private readonly outputs: bigint[] = [];

  constructor(initialInputs: readonly bigint[]) {
    this.inputs = [...initialInputs];
  }

  get pendingInputCount(): number {
    return this.inputs.length - this.inputCursor;
  }

  get outputCount(): number {
    return this.outputs.length;
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

  snapshotInputs(): readonly bigint[] {
    return Object.freeze(this.inputs.slice(this.inputCursor));
  }

  snapshotOutputs(): readonly bigint[] {
    return Object.freeze([...this.outputs]);
  }
}
