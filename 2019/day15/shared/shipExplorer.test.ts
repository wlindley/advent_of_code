import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram, type IntcodeProgram } from '../../shared/intcode';
import { DEFAULT_OXYGEN_LIMITS } from './oxygenModels';
import { exploreShip } from './shipExplorer';

function compileMazeToIntcode(rows: readonly string[]): IntcodeProgram {
  const height = rows.length;
  const width = rows[0]!.length;
  const b = 50;
  let sx = 0, sy = 0;
  const cells: number[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const ch = rows[y]![x]!;
      if (ch === 'S') {
        sx = x;
        sy = y;
      }
      cells.push(ch === '#' ? 0 : ch === 'O' ? 2 : 1);
    }
  }
  const code = [
    3, b, 1001, b, b + 7, 7, 1, 0, b + 1, b + 3,
    1001, b, b + 12, 15, 1, 0, b + 2, b + 4,
    1002, b + 4, width, b + 5, 1, b + 5, b + 3, b + 5,
    1001, b + 5, b + 17, 31, 1001, 0, 0, b + 6,
    4, b + 6, 1006, b + 6, 0,
    1001, b + 3, 0, b + 1, 1001, b + 4, 0, b + 2, 1105, 1, 0,
    0, sx, sy, 0, 0, 0, 0, 0, 0, 0, -1, 1, 0, -1, 1, 0, 0,
    ...cells,
  ];
  return parseIntcodeProgram(code.join(','));
}

describe('shipExplorer', () => {
  it('explores cyclic mazes completely and supports non-leaf oxygen backtracking', () => {
    const program = compileMazeToIntcode([
      '#####',
      '#S.O#',
      '#.#.#',
      '#...#',
      '#####',
    ]);

    const noMoves = exploreShip(program, DEFAULT_OXYGEN_LIMITS, false);
    expect(noMoves.moves).toEqual([]);
    expect(noMoves.map.openCount).toBe(8);
    expect(noMoves.map.wallCount).toBe(13);
    expect(noMoves.map.oxygen).toEqual({ x: 2, y: 0 });

    const withMoves = exploreShip(program, DEFAULT_OXYGEN_LIMITS, true);
    expect(withMoves.moves.length).toBeGreaterThan(0);
    expect(withMoves.moves.some((move) => move.isBacktrack)).toBe(true);
    expect(withMoves.moves.some((move) => move.isBacktrack && move.status === 2)).toBe(true);
    expect(withMoves.moves[withMoves.moves.length - 1]!.droid).toEqual({ x: 0, y: 0 });
  });

  it('rejects programs that emit premature output, halt early, or fail output protocol', () => {
    expect(() => exploreShip(parseIntcodeProgram('104,1,3,10,99'), DEFAULT_OXYGEN_LIMITS, false)).toThrow(
      'Unexpected output before droid command',
    );
    expect(() => exploreShip(parseIntcodeProgram('99'), DEFAULT_OXYGEN_LIMITS, false)).toThrow(
      'waiting-input',
    );
    expect(() => exploreShip(parseIntcodeProgram('3,10,104,1,99'), DEFAULT_OXYGEN_LIMITS, false)).toThrow(
      'expected waiting-input',
    );
    expect(() => exploreShip(parseIntcodeProgram('3,10,99'), DEFAULT_OXYGEN_LIMITS, false)).toThrow(
      'Expected 1 droid status output',
    );
  });

  it('enforces move limits, unique oxygen system, and consistent backtracking', () => {
    const simple = compileMazeToIntcode(['###', '#S#', '###']);
    expect(() => exploreShip(simple, { maxVmSteps: 100_000, maxMoves: 1 }, false)).toThrow(RangeError);

    const twoOxygen = compileMazeToIntcode(['#####', '#SOO#', '#####']);
    expect(() => exploreShip(twoOxygen, DEFAULT_OXYGEN_LIMITS, false)).toThrow(
      'Multiple oxygen systems detected',
    );

    // Moves north once (outputs 1), probes 3 walls (0), then backtracks south (outputs 0 -> error)
    const badBacktrack = parseIntcodeProgram('3,50,104,1,3,50,104,0,3,50,104,0,3,50,104,0,3,50,104,0,99');
    expect(() => exploreShip(badBacktrack, DEFAULT_OXYGEN_LIMITS, false)).toThrow('backtracking');
  });
});
