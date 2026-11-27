import { describe, expect, it } from 'vitest';
import { AsciiIoChannel } from './asciiIo';

describe('AsciiIoChannel', () => {
  it('streams bigint and ASCII inputs in O(1) FIFO order and snapshots pending inputs', () => {
    const io = new AsciiIoChannel();
    expect(io.pendingInputCount).toBe(0);
    expect(io.readInput()).toBeNull();

    io.pushInput(10n);
    io.pushAscii('A,B\n');
    expect(io.pendingInputCount).toBe(5);
    expect(io.snapshotInputs()).toEqual([10n, 65n, 44n, 66n, 10n]);

    expect(io.readInput()).toBe(10n);
    expect(io.readInput()).toBe(65n);
    expect(io.pendingInputCount).toBe(3);
    expect(io.snapshotInputs()).toEqual([44n, 66n, 10n]);
  });

  it('rejects non-ASCII characters when encoding input', () => {
    const io = new AsciiIoChannel();
    expect(() => io.pushAscii('A\u0080')).toThrow(RangeError);
  });

  it('drains ASCII outputs and preserves full output snapshot', () => {
    const io = new AsciiIoChannel();
    for (const ch of '..#\n^#\n') {
      io.writeOutput(BigInt(ch.charCodeAt(0)));
    }
    expect(io.outputCount).toBe(7);
    expect(io.pendingOutputCount).toBe(7);
    expect(io.drainAscii()).toBe('..#\n^#\n');
    expect(io.pendingOutputCount).toBe(0);
    expect(io.drainAscii()).toBe('');
    expect(io.snapshotOutputs()).toHaveLength(7);

    io.writeOutput(-1n);
    expect(() => io.drainAscii()).toThrow(RangeError);

    io.writeOutput(128n);
    expect(() => io.drainAscii()).toThrow(RangeError);
  });

  it('extracts single large dust output alongside ASCII feed and rejects invalid dust streams', () => {
    const io = new AsciiIoChannel();
    for (const ch of 'Main:\n') {
      io.writeOutput(BigInt(ch.charCodeAt(0)));
    }
    io.writeOutput(999999n);
    expect(io.drainDustOutput()).toEqual({ asciiLog: 'Main:\n', dust: 999999n });

    io.writeOutput(65n);
    expect(() => io.drainDustOutput()).toThrow('Missing dust output value');

    io.writeOutput(-5n);
    expect(() => io.drainDustOutput()).toThrow(RangeError);

    io.writeOutput(200n);
    io.writeOutput(201n);
    expect(() => io.drainDustOutput()).toThrow('Multiple dust values in output');
  });
});
