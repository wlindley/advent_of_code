import { describe, expect, it } from 'vitest';
import { ORIGIN, type OxygenTraceFrame, type ShipTile } from './oxygenModels';
import { OXYGEN_FILL_MINUTES_POLICY, SHORTEST_PATH_POLICY } from './oxygenSolver';
import { CELL_SIZE, buildOxygenSvgLayout, formatCommandLabel } from './vizLayout';

function makeTiles(entries: readonly [number, number, ShipTile['kind']][]): ReadonlyMap<string, ShipTile> {
  const map = new Map<string, ShipTile>();
  for (const [x, y, kind] of entries) {
    map.set(`${x},${y}`, { x, y, kind });
  }
  return map;
}

describe('vizLayout', () => {
  it('formats all four droid movement commands and null start state', () => {
    expect(formatCommandLabel(null)).toBe('START');
    expect(formatCommandLabel(1)).toBe('NORTH (1)');
    expect(formatCommandLabel(2)).toBe('SOUTH (2)');
    expect(formatCommandLabel(3)).toBe('WEST (3)');
    expect(formatCommandLabel(4)).toBe('EAST (4)');
  });

  it('batches explore phase frames across initial, wall, open, oxygen, and backtrack steps', () => {
    const tiles = makeTiles([
      [0, 0, 'open'],
      [0, -1, 'wall'],
      [1, 0, 'oxygen'],
    ]);
    const initial: OxygenTraceFrame = {
      stepIndex: 0,
      totalSteps: 4,
      phase: 'explore',
      tiles: makeTiles([[0, 0, 'open']]),
      droid: ORIGIN,
      oxygen: null,
      lastCommand: null,
      lastStatus: null,
      isBacktrack: false,
      frontierDistance: null,
      distances: null,
      shortestPath: [],
    };
    const initLayout = buildOxygenSvgLayout(initial, SHORTEST_PATH_POLICY);
    expect(initLayout.viewBox).toBe(`-${CELL_SIZE} -${CELL_SIZE} ${3 * CELL_SIZE} ${3 * CELL_SIZE}`);
    expect(initLayout.droidCenter).toEqual({ x: 8, y: 8 });
    expect(initLayout.oxygenCenter).toBeNull();
    expect(initLayout.statusSummary).toContain('Initial droid');

    const wallMove: OxygenTraceFrame = {
      ...initial,
      stepIndex: 1,
      tiles,
      lastCommand: 1,
      lastStatus: 0,
    };
    expect(buildOxygenSvgLayout(wallMove, SHORTEST_PATH_POLICY).statusSummary).toContain('-> Wall');

    const oxygenMove: OxygenTraceFrame = {
      ...initial,
      stepIndex: 2,
      tiles,
      droid: { x: 1, y: 0 },
      oxygen: { x: 1, y: 0 },
      lastCommand: 4,
      lastStatus: 2,
    };
    const oxyLayout = buildOxygenSvgLayout(oxygenMove, SHORTEST_PATH_POLICY);
    expect(oxyLayout.oxygenCenter).toEqual({ x: 24, y: 8 });
    expect(oxyLayout.statusSummary).toContain('-> Oxygen!');

    const backtrackMove: OxygenTraceFrame = {
      ...oxygenMove,
      stepIndex: 3,
      droid: ORIGIN,
      lastCommand: 3,
      lastStatus: 1,
      isBacktrack: true,
    };
    const backLayout = buildOxygenSvgLayout(backtrackMove, SHORTEST_PATH_POLICY);
    expect(backLayout.statusSummary).toContain('[Backtrack]');
    expect(backLayout.statusSummary).toContain('-> Open');
  });

  it('batches solve phase wavefront, frontier, and shortest path primitives', () => {
    const solveFrame: OxygenTraceFrame = {
      stepIndex: 4,
      totalSteps: 4,
      phase: 'solve',
      tiles: makeTiles([
        [0, 0, 'open'],
        [1, 0, 'oxygen'],
        [0, -1, 'wall'],
      ]),
      droid: ORIGIN,
      oxygen: { x: 1, y: 0 },
      lastCommand: null,
      lastStatus: null,
      isBacktrack: false,
      frontierDistance: 1,
      distances: new Map([
        ['0,0', 0],
        ['1,0', 1],
      ]),
      shortestPath: [ORIGIN, { x: 1, y: 0 }],
    };

    const layout = buildOxygenSvgLayout(solveFrame, OXYGEN_FILL_MINUTES_POLICY);
    expect(layout.wallCount).toBe(1);
    expect(layout.openCount).toBe(2);
    expect(layout.reachedCount).toBe(2);
    expect(layout.wallPath).not.toBe('');
    expect(layout.openPath).not.toBe('');
    expect(layout.wavePath).not.toBe('');
    expect(layout.frontierPath).not.toBe('');
    expect(layout.shortestPathPoints).toBe('8,8 24,8');
    expect(layout.droidCenter).toBeNull();
    expect(layout.originCenter).toEqual({ x: 8, y: 8 });
    expect(layout.oxygenCenter).toEqual({ x: 24, y: 8 });
    expect(layout.statusSummary).toContain('Oxygen Wavefront');
  });
});
