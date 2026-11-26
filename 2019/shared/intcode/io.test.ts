import { describe, expect, it } from 'vitest';
import { BufferedIoChannel } from './io';

describe('BufferedIoChannel', () => {
  it('consumes initial and pushed inputs in FIFO order with dynamic counts', () => {
    const seed = [1n, -7n];
    const channel = new BufferedIoChannel(seed);
    seed.push(999n);

    expect(channel.pendingInputCount).toBe(2);
    expect(channel.outputCount).toBe(0);
    expect(channel.readInput()).toBe(1n);
    expect(channel.pendingInputCount).toBe(1);

    channel.pushInput(42n);
    expect(channel.pendingInputCount).toBe(2);
    expect(channel.readInput()).toBe(-7n);
    expect(channel.readInput()).toBe(42n);
    expect(channel.pendingInputCount).toBe(0);
    expect(channel.readInput()).toBeNull();
  });

  it('records outputs and returns frozen defensive snapshots', () => {
    const channel = new BufferedIoChannel([5n, 6n]);
    expect(channel.readInput()).toBe(5n);

    const inputsSnap = channel.snapshotInputs();
    expect(Object.isFrozen(inputsSnap)).toBe(true);
    expect(inputsSnap).toEqual([6n]);

    channel.writeOutput(0n);
    channel.writeOutput(9007199254740993n);
    expect(channel.outputCount).toBe(2);

    const outputsSnap = channel.snapshotOutputs();
    expect(Object.isFrozen(outputsSnap)).toBe(true);
    expect(outputsSnap).toEqual([0n, 9007199254740993n]);

    channel.writeOutput(10n);
    expect(outputsSnap).toEqual([0n, 9007199254740993n]);
  });
});
