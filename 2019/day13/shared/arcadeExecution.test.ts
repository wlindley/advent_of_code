import { describe, expect, it } from 'vitest';
import { IntcodeMachine, parseIntcodeProgram } from '../../shared/intcode';
import {
  decodeTriple,
  drainPendingTriples,
  parseTileId,
  runArcade,
  toNonNegativeSafeInt,
} from './arcadeExecution';
import { ArcadeIoChannel } from './arcadeIo';
import { DEFAULT_ARCADE_LIMITS, chooseJoystickTilt, tileKey, type TileId } from './arcadeModels';

const EXAMPLE_PROGRAM = '104,1,104,2,104,3,104,6,104,5,104,4,99';

// Compact reactive Breakout: addr 0 is 1 (ADD 20+20->20 = 40 -> halt) or patched to 2 (MUL 20*20->20 = 400 -> play).
// Play: draws block (2,1,2), paddle (1,4,3), ball (3,2,4); reads 2 joystick turns tracking ball to x=3; breaks block & scores 100.
const REACTIVE_BREAKOUT_PROGRAM = [
  1, 3, 3, 40,          // [0..3]  ADD/MUL [3],[3]->[40] (mem[3]=40; 80 if unpatched, 1600 if patched to 2)
  1008, 40, 1600, 41,   // [4..7]  EQ [40],1600 -> [41]
  1005, 41, 19,         // [8..10] JNZ [41], 19 (free play)
  104, 2, 104, 1, 104, 2, // [11..16] draw block (2,1)
  99, 0,                // [17..18] halt Part 1
  104, 2, 104, 1, 104, 2, // [19..24] draw block (2,1)
  104, 1, 104, 4, 104, 3, // [25..30] draw paddle (1,4)
  104, 3, 104, 2, 104, 4, // [31..36] draw ball (3,2)
  1105, 1, 42,          // [37..39] jump to 42
  0, 0,                 // [40..41] scratch
  3, 40,                // [42..43] input turn 1 -> [40] (expects +1)
  1, 40, 40, 41,        // [44..47] test [40]
  104, 2, 104, 4, 104, 3, // [48..53] move paddle -> (2,4)
  3, 40,                // [54..55] input turn 2 -> [40] (expects +1)
  104, 3, 104, 4, 104, 3, // [56..61] move paddle -> (3,4)
  104, 2, 104, 1, 104, 0, // [62..67] clear block (2,1)
  104, -1, 104, 0, 104, 100, // [68..73] score 100
  99,                   // [74] halt Part 2
].join(',');

function runFlatReferenceOracle(raw: string, freePlay: boolean) {
  const base = parseIntcodeProgram(raw);
  const program = freePlay ? base.withPatches([{ address: 0n, value: 2n }]) : base;
  const io = new ArcadeIoChannel();
  const machine = IntcodeMachine.fromCompleteProgram(program, { io });
  const tiles = new Map<string, TileId>();
  let score = 0, ballX: number | null = null, paddleX: number | null = null;
  const drain = () => {
    while (io.pendingOutputCount >= 3) {
      const x = Number(io.takeOutput()!), y = Number(io.takeOutput()!), v = Number(io.takeOutput()!);
      if (x === -1 && y === 0) score = v;
      else {
        tiles.set(tileKey(x, y), v as TileId);
        if (v === 3) paddleX = x;
        if (v === 4) ballX = x;
      }
    }
  };
  machine.run(100_000);
  drain();
  while (machine.status === 'waiting-input') {
    machine.pushInput(BigInt(chooseJoystickTilt(ballX, paddleX)));
    machine.run(100_000);
    drain();
  }
  let blocks = 0;
  for (const id of tiles.values()) if (id === 2) blocks += 1;
  return { blocks, score };
}

describe('arcadeExecution', () => {
  it('validates safe non-negative ints, tile IDs, and decoded triples', () => {
    expect(toNonNegativeSafeInt(0n, 'x')).toBe(0);
    expect(toNonNegativeSafeInt(BigInt(Number.MAX_SAFE_INTEGER), 'x')).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => toNonNegativeSafeInt(-1n, 'x')).toThrow(RangeError);
    expect(() => toNonNegativeSafeInt(BigInt(Number.MAX_SAFE_INTEGER) + 1n, 'x')).toThrow(RangeError);

    expect(([0n, 1n, 2n, 3n, 4n] as const).map(parseTileId)).toEqual([0, 1, 2, 3, 4]);
    expect(() => parseTileId(-1n)).toThrow(RangeError);
    expect(() => parseTileId(5n)).toThrow(RangeError);

    expect(decodeTriple(-1n, 0n, 250n)).toEqual({ kind: 'score', score: 250 });
    expect(decodeTriple(4n, 5n, 2n)).toEqual({ kind: 'tile', x: 4, y: 5, tileId: 2 });
    expect(() => decodeTriple(-1n, 1n, 0n)).toThrow(RangeError);
  });

  it('rejects incomplete output triples in drainPendingTriples', () => {
    const io = new ArcadeIoChannel();
    io.writeOutput(1n);
    io.writeOutput(2n);
    const state = { tiles: new Map(), score: 0, paddleX: null, ballX: null, drawCount: 0, events: [] };
    expect(() => drainPendingTriples(io, state, false)).toThrow(/Expected multiples of 3/);
  });

  it('executes official example and cross-checks reactive Breakout against independent oracle', () => {
    const example = runArcade(parseIntcodeProgram(EXAMPLE_PROGRAM), null, DEFAULT_ARCADE_LIMITS, true);
    expect(example.report.blockCount).toBe(0);
    expect(example.report.tileAt(1, 2)).toBe(3);
    expect(example.report.tileAt(6, 5)).toBe(4);
    expect(example.turnEndOffsets).toEqual([2]);
    expect(example.turnTilts).toEqual([]);
    expect(example.report.blockCount).toBe(runFlatReferenceOracle(EXAMPLE_PROGRAM, false).blocks);

    const reactive = parseIntcodeProgram(REACTIVE_BREAKOUT_PROGRAM);
    const part1 = runArcade(reactive, null, DEFAULT_ARCADE_LIMITS, false);
    expect(part1.report.blockCount).toBe(1);
    expect(part1.events).toEqual([]);
    expect(part1.report.blockCount).toBe(runFlatReferenceOracle(REACTIVE_BREAKOUT_PROGRAM, false).blocks);

    const patch = { address: 0n, value: 2n };
    const part2 = runArcade(reactive, patch, DEFAULT_ARCADE_LIMITS, true);
    expect(part2.report.blockCount).toBe(0);
    expect(part2.report.score).toBe(100);
    expect(part2.report.inputTurns).toBe(2);
    expect(part2.turnTilts).toEqual([1, 1]);
    expect(part2.turnEndOffsets).toEqual([3, 4, 7]);
    expect(part2.report.score).toBe(runFlatReferenceOracle(REACTIVE_BREAKOUT_PROGRAM, true).score);
  });

  it('throws RangeError when maxInputTurns limit is exceeded', () => {
    const infiniteInputProgram = parseIntcodeProgram('3,5,1105,1,0,0');
    expect(() =>
      runArcade(infiniteInputProgram, null, { maxVmSteps: 10_000, maxInputTurns: 2 }, false),
    ).toThrow(RangeError);
  });
});
