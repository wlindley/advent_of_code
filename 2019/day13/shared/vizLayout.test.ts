import { describe, expect, it } from 'vitest';
import { tileKey, type ArcadeTraceFrame, type ScreenTile } from './arcadeModels';
import { RAINBOW_BAND_COLORS, TILE_SIZE, buildArcadeSvgLayout, formatTiltLabel } from './vizLayout';

function makeFrame(overrides: Partial<ArcadeTraceFrame>): ArcadeTraceFrame {
  return {
    stepIndex: 0,
    totalSteps: 0,
    phase: 'draw',
    tiles: new Map(),
    score: 0,
    paddleX: null,
    ballX: null,
    ballY: null,
    ballTrail: [],
    lastTilt: null,
    inputTurn: 0,
    totalInputTurns: 0,
    ...overrides,
  };
}

describe('vizLayout', () => {
  it('formats joystick tilt labels for all states and exports 5 rainbow colors', () => {
    expect(RAINBOW_BAND_COLORS).toHaveLength(5);
    expect(TILE_SIZE).toBe(16);
    expect(formatTiltLabel(null)).toBe('NONE');
    expect(formatTiltLabel(-1)).toBe('LEFT (-1)');
    expect(formatTiltLabel(0)).toBe('NEUTRAL (0)');
    expect(formatTiltLabel(1)).toBe('RIGHT (+1)');
  });

  it('batches walls, 5 rainbow block bands, paddle, ball, and trail for populated screens', () => {
    const tiles = new Map<string, ScreenTile>([
      [tileKey(0, 0), { x: 0, y: 0, id: 0 }],
      [tileKey(1, 0), { x: 1, y: 0, id: 1 }],
      [tileKey(2, 0), { x: 2, y: 0, id: 2 }],
      [tileKey(2, 1), { x: 2, y: 1, id: 2 }],
      [tileKey(2, 2), { x: 2, y: 2, id: 2 }],
      [tileKey(2, 3), { x: 2, y: 3, id: 2 }],
      [tileKey(2, 4), { x: 2, y: 4, id: 2 }],
      [tileKey(3, 5), { x: 3, y: 5, id: 2 }],
      [tileKey(4, 6), { x: 4, y: 6, id: 3 }],
      [tileKey(5, 4), { x: 5, y: 4, id: 4 }],
    ]);
    const frame = makeFrame({
      stepIndex: 10,
      totalSteps: 10,
      phase: 'draw',
      tiles,
      paddleX: 4,
      ballX: 5,
      ballY: 4,
      ballTrail: [{ x: 4, y: 3 }, { x: 5, y: 4 }],
    });

    const layout = buildArcadeSvgLayout(frame);
    expect(layout.wallPath).not.toBe('');
    expect(layout.blockBandPaths[0].split('M').length - 1).toBe(2); // y=0 and y=5
    expect(layout.blockBandPaths[1]).not.toBe('');
    expect(layout.blockBandPaths[2]).not.toBe('');
    expect(layout.blockBandPaths[3]).not.toBe('');
    expect(layout.blockBandPaths[4]).not.toBe('');
    expect(layout.paddlePath).not.toBe('');
    expect(layout.ballCenter).toEqual({ x: 5 * 16 + 8, y: 4 * 16 + 8 });
    expect(layout.ballTrailPoints).toBe(`${4 * 16 + 8},${3 * 16 + 8} ${5 * 16 + 8},${4 * 16 + 8}`);
    expect(layout.wallCount).toBe(1);
    expect(layout.blockCount).toBe(6);
    expect(layout.paddleCount).toBe(1);
    expect(layout.ballCount).toBe(1);
    expect(layout.bounds).toEqual({ minX: 0, maxX: 5, minY: 0, maxY: 6 });
    expect(layout.viewBox).toBe('-16 -16 128 144');
    expect(layout.statusSummary).toBe('Drew 10 / 10 outputs (6 blocks)');
  });

  it('formats draw-initial and play-phase summaries accurately', () => {
    expect(buildArcadeSvgLayout(makeFrame({ phase: 'draw', stepIndex: 0, totalSteps: 0 })).statusSummary).toBe(
      'No draw instructions emitted',
    );
    expect(buildArcadeSvgLayout(makeFrame({ phase: 'draw', stepIndex: 0, totalSteps: 4 })).statusSummary).toBe(
      'Initial blank screen',
    );
    expect(buildArcadeSvgLayout(makeFrame({ phase: 'play', inputTurn: 0, totalInputTurns: 3 })).statusSummary).toBe(
      'Cabinet initialized (0 blocks)',
    );
    const turnLayout = buildArcadeSvgLayout(
      makeFrame({ phase: 'play', inputTurn: 2, totalInputTurns: 3, lastTilt: -1, score: 420 }),
    );
    expect(turnLayout.tiltLabel).toBe('LEFT (-1)');
    expect(turnLayout.statusSummary).toBe('Turn 2 / 3 · Tilt LEFT (-1) · Score 420');
  });
});
