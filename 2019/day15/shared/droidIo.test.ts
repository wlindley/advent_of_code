import { describe, expect, it } from 'vitest';
import { DroidIoChannel } from './droidIo';

describe('DroidIoChannel', () => {
  it('starts empty with zero pending inputs, outputs, and null reads', () => {
    const io = new DroidIoChannel();
    expect(io.pendingInputCount).toBe(0);
    expect(io.outputCount).toBe(0);
    expect(io.pendingOutputCount).toBe(0);
    expect(io.readInput()).toBeNull();
    expect(io.takeOutput()).toBeNull();
    expect(io.snapshotInputs()).toEqual([]);
    expect(io.snapshotOutputs()).toEqual([]);
  });

  it('pushes, snapshots, and drains movement commands in O(1) FIFO order', () => {
    const io = new DroidIoChannel();
    io.pushInput(1n);
    io.pushInput(4n);
    expect(io.pendingInputCount).toBe(2);
    expect(io.snapshotInputs()).toEqual([1n, 4n]);

    expect(io.readInput()).toBe(1n);
    expect(io.pendingInputCount).toBe(1);
    expect(io.snapshotInputs()).toEqual([4n]);

    expect(io.readInput()).toBe(4n);
    expect(io.pendingInputCount).toBe(0);
    expect(io.readInput()).toBeNull();
  });

  it('writes and drains status outputs while preserving outputCount and snapshotOutputs', () => {
    const io = new DroidIoChannel();
    io.writeOutput(0n);
    io.writeOutput(1n);
    io.writeOutput(2n);
    expect(io.outputCount).toBe(3);
    expect(io.pendingOutputCount).toBe(3);

    expect(io.takeOutput()).toBe(0n);
    expect(io.takeOutput()).toBe(1n);
    expect(io.pendingOutputCount).toBe(1);
    expect(io.outputCount).toBe(3);

    expect(io.takeOutput()).toBe(2n);
    expect(io.pendingOutputCount).toBe(0);
    expect(io.takeOutput()).toBeNull();
    expect(io.snapshotOutputs()).toEqual([0n, 1n, 2n]);
  });
});
