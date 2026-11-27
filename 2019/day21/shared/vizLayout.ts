import { SENSOR_ORDER, type SensorRegister } from './springscript';
import type { HullTick } from './hullSimulator';
import type { SpringdroidTraceFrame } from './springdroidSolver';

export const SVG_HEIGHT = 210;
export const TILE_SIZE = 34;
export const TILE_GAP = 4;
export const SVG_PADDING = 20;

const GROUND_Y = 128;

export interface HullTileLayout {
  readonly index: number;
  readonly x: number;
  readonly y: number;
  readonly solid: boolean;
  readonly virtual: boolean;
}

export interface SensorPinLayout {
  readonly register: SensorRegister;
  readonly x: number;
  readonly y: number;
  readonly solid: boolean;
}

export interface SpringdroidSvgLayout {
  readonly viewBox: string;
  readonly width: number;
  readonly height: number;
  readonly groundY: number;
  readonly tiles: readonly HullTileLayout[];
  readonly sensorPins: readonly SensorPinLayout[];
  readonly droidX: number;
  readonly droidY: number;
  readonly targetX: number;
  readonly targetY: number;
  readonly isJump: boolean;
  readonly arcPath: string;
}

function tileLeftX(index: number): number {
  return SVG_PADDING + index * (TILE_SIZE + TILE_GAP);
}

function tileCenterX(index: number): number {
  return tileLeftX(index) + TILE_SIZE / 2;
}

function buildTiles(hull: string, visibleTiles: number): readonly HullTileLayout[] {
  const tiles: HullTileLayout[] = [];
  for (let i = 0; i < visibleTiles; i += 1) {
    const virtual = i >= hull.length;
    const solid = virtual || hull[i] === '#';
    tiles.push(Object.freeze({ index: i, x: tileLeftX(i), y: GROUND_Y, solid, virtual }));
  }
  return Object.freeze(tiles);
}

function buildSensorPins(tick: HullTick, sensorCount: number): readonly SensorPinLayout[] {
  const sensorPins: SensorPinLayout[] = [];
  for (let i = 0; i < sensorCount; i += 1) {
    const register = SENSOR_ORDER[i]!;
    sensorPins.push(
      Object.freeze({
        register,
        x: tileCenterX(tick.position + i + 1),
        y: GROUND_Y + TILE_SIZE + 24,
        solid: tick.sensors[register],
      }),
    );
  }
  return Object.freeze(sensorPins);
}

/** Computes light-mode SVG tile, sensor pin, droid, and jump/walk path coordinates. */
export function buildSpringdroidSvgLayout(frame: SpringdroidTraceFrame): SpringdroidSvgLayout {
  const sensorCount = frame.mode === 'WALK' ? 4 : 9;
  const visibleTiles = frame.hull.length + sensorCount;
  const width = SVG_PADDING * 2 + visibleTiles * TILE_SIZE + (visibleTiles - 1) * TILE_GAP;
  const droidX = tileCenterX(frame.tick.position);
  const droidY = GROUND_Y - 16;
  const targetX = tileCenterX(frame.tick.nextPosition);
  const isJump = frame.tick.evaluation.registerJ;
  const arcPath = isJump
    ? `M ${droidX} ${GROUND_Y - 4} Q ${(droidX + targetX) / 2} ${GROUND_Y - 96} ${targetX} ${GROUND_Y - 4}`
    : `M ${droidX + 12} ${droidY} L ${targetX - 8} ${droidY}`;

  return Object.freeze({
    viewBox: `0 0 ${width} ${SVG_HEIGHT}`,
    width,
    height: SVG_HEIGHT,
    groundY: GROUND_Y,
    tiles: buildTiles(frame.hull, visibleTiles),
    sensorPins: buildSensorPins(frame.tick, sensorCount),
    droidX,
    droidY,
    targetX,
    targetY: droidY,
    isJump,
    arcPath,
  });
}
