import { describe, expect, it } from 'vitest';
import { ArcadeIoChannel } from './arcadeIo';

describe('ArcadeIoChannel', () => {
  it('starts empty with zero pending inputs, outputs, and null reads', () => {
    const io = new ArcadeIoChannel();
    expect(io.pendingInputCount).toBe(0);
    expect(io.outputCount).toBe(0);
    expect(io.pendingOutputCount).toBe(0);
    expect(io.readInput()).toBeNull();
    expect(io.takeOutput()).toBeNull();
    expect(io.snapshotInputs()).toEqual([]);
    expect(io.snapshotOutputs()).toEqual([]);
  });

  it('pushes, snapshots, and drains joystick inputs in O(1) FIFO order', () => {
    const io = new ArcadeIoChannel();
    io.pushInput(-1n);
    io.pushInput(1n);
    expect(io.pendingInputCount).toBe(2);
    expect(io.snapshotInputs()).toEqual([-1n, 1n]);

    expect(io.readInput()).toBe(-1n);
    expect(io.pendingInputCount).toBe(1);
    expect(io.snapshotInputs()).toEqual([1n]);

    expect(io.readInput()).toBe(1n);
    expect(io.pendingInputCount).toBe(0);
    expect(io.readInput()).toBeNull();
  });

  it('writes and drains outputs while preserving total outputCount and snapshot history', () => {
    const io = new ArcadeIoChannel();
    io.writeOutput(1n);
    io.writeOutput(2n);
    io.writeOutput(3n);
    expect(io.outputCount).toBe(3);
    expect(io.pendingOutputCount).toBe(3);

    expect(io.takeOutput()).toBe(1n);
    expect(io.takeOutput()).toBe(2n);
    expect(io.pendingOutputCount).toBe(1);
    expect(io.outputCount).toBe(3);

    expect(io.takeOutput()).toBe(3n);
    expect(io.pendingOutputCount).toBe(0);
    expect(io.takeOutput()).toBeNull();
    expect(io.snapshotOutputs()).toEqual([1n, 2n, 3n]);
  });
});
