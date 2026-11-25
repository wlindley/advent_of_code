import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { MAX_BLOCKING_NEIGHBORS, WarehouseFloor, parseWarehouse } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 250;

export interface FloorScanFrame {
  readonly step: number;
  readonly scannedRows: number;
  readonly totalRolls: number;
  readonly accessibleCount: number;
  readonly degreeHistogram: readonly number[];
}

export const solver: PuzzleSolver<WarehouseFloor, number, FloorScanFrame> = {
  parse: parseWarehouse,

  solve(floor: WarehouseFloor): number {
    const { degrees } = floor.computeDegreeMap();
    let accessible = 0;
    for (let r = 0; r < floor.rows; r += 1) {
      const rowOffset = r * floor.cols;
      for (let c = 0; c < floor.cols; c += 1) {
        if (floor.isRoll(r, c) && degrees[rowOffset + c]! < MAX_BLOCKING_NEIGHBORS) {
          accessible += 1;
        }
      }
    }
    return accessible;
  },

  trace(floor: WarehouseFloor, options?: TraceOptions): readonly FloorScanFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    }

    const stride =
      maxSteps === 1
        ? Number.POSITIVE_INFINITY
        : floor.rows + 1 <= maxSteps
          ? 1
          : Math.ceil(floor.rows / (maxSteps - 1));

    const { degrees } = floor.computeDegreeMap();
    const histogram = new Array<number>(9).fill(0);
    const frames: FloorScanFrame[] = [];

    if (maxSteps > 1) {
      frames.push({
        step: 0, scannedRows: 0, totalRolls: 0, accessibleCount: 0, degreeHistogram: histogram.slice(),
      });
    }

    let totalRolls = 0;
    let accessibleCount = 0;
    for (let r = 0; r < floor.rows; r += 1) {
      const rowOffset = r * floor.cols;
      for (let c = 0; c < floor.cols; c += 1) {
        if (!floor.isRoll(r, c)) continue;
        totalRolls += 1;
        const deg = degrees[rowOffset + c]!;
        histogram[deg] = histogram[deg]! + 1;
        if (deg < MAX_BLOCKING_NEIGHBORS) accessibleCount += 1;
      }

      const scannedRows = r + 1;
      // Always retain the final row snapshot even when rows is not divisible by stride.
      if (scannedRows % stride === 0 || scannedRows === floor.rows) {
        frames.push({
          step: scannedRows, scannedRows, totalRolls, accessibleCount, degreeHistogram: histogram.slice(),
        });
      }
    }

    return frames;
  },
};
