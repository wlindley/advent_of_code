import { describe, expect, it } from 'vitest';
import { SpringdroidAsciiIo } from './asciiIo';

describe('SpringdroidAsciiIo', () => {
  it('queues and reads ASCII and raw bigint inputs with O(1) cursor snapshots', () => {
    const io = new SpringdroidAsciiIo();
    io.pushAscii('WALK\n');
    io.pushInput(10n);

    expect(io.pendingInputCount).toBe(6);
    expect(io.snapshotInputs()).toEqual([87n, 65n, 76n, 75n, 10n, 10n]);
    expect(io.readInput()).toBe(87n);
    expect(io.pendingInputCount).toBe(5);
    for (let i = 0; i < 5; i += 1) {
      io.readInput();
    }
    expect(io.readInput()).toBeNull();
    expect(() => io.pushAscii('é')).toThrow(RangeError);
  });

  it('drains ASCII log with optional hull damage and rejects invalid outputs', () => {
    const io = new SpringdroidAsciiIo();
    for (const ch of 'OK\n') {
      io.writeOutput(BigInt(ch.charCodeAt(0)));
    }
    io.writeOutput(19354n);
    expect(io.outputCount).toBe(4);
    expect(io.snapshotOutputs()).toEqual([79n, 75n, 10n, 19354n]);
    expect(io.drainSpringdroidOutput()).toEqual({ asciiLog: 'OK\n', hullDamage: 19354n });

    io.writeOutput(65n);
    expect(io.drainSpringdroidOutput()).toEqual({ asciiLog: 'A', hullDamage: null });

    io.writeOutput(-1n);
    expect(() => io.drainSpringdroidOutput()).toThrow(RangeError);

    const multi = new SpringdroidAsciiIo();
    multi.writeOutput(200n);
    multi.writeOutput(300n);
    expect(() => multi.drainSpringdroidOutput()).toThrow(Error);
  });
});
