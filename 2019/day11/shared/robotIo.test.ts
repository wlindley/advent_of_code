import { describe, expect, it } from 'vitest';
import { RobotIoChannel } from './robotIo';

describe('RobotIoChannel', () => {
  it('starts empty with zero pending inputs, outputs, and null reads', () => {
    const io = new RobotIoChannel();
    expect(io.pendingInputCount).toBe(0);
    expect(io.outputCount).toBe(0);
    expect(io.pendingOutputCount).toBe(0);
    expect(io.readInput()).toBeNull();
    expect(io.takeOutput()).toBeNull();
    expect(io.snapshotInputs()).toEqual([]);
    expect(io.snapshotOutputs()).toEqual([]);
  });

  it('pushes, snapshots, and drains inputs in O(1) FIFO order', () => {
    const io = new RobotIoChannel();
    io.pushInput(0n);
    io.pushInput(1n);
    expect(io.pendingInputCount).toBe(2);
    expect(io.snapshotInputs()).toEqual([0n, 1n]);

    expect(io.readInput()).toBe(0n);
    expect(io.pendingInputCount).toBe(1);
    expect(io.snapshotInputs()).toEqual([1n]);

    expect(io.readInput()).toBe(1n);
    expect(io.pendingInputCount).toBe(0);
    expect(io.readInput()).toBeNull();
  });

  it('writes and drains pending outputs while preserving total outputCount and snapshot history', () => {
    const io = new RobotIoChannel();
    io.writeOutput(1n);
    io.writeOutput(0n);
    expect(io.outputCount).toBe(2);
    expect(io.pendingOutputCount).toBe(2);

    expect(io.takeOutput()).toBe(1n);
    expect(io.pendingOutputCount).toBe(1);
    expect(io.outputCount).toBe(2);

    expect(io.takeOutput()).toBe(0n);
    expect(io.pendingOutputCount).toBe(0);
    expect(io.takeOutput()).toBeNull();
    expect(io.snapshotOutputs()).toEqual([1n, 0n]);
  });
});
