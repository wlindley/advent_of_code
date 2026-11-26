import { sampleTraceIndices, validateMaxSteps } from '../../../shared/core';
import { BspStep, traceSeatNarrowing } from './bsp';
import { CabinOccupancy } from './occupancy';
import { SeatQueryPolicy, SeatQueryResult } from './policy';
import { BoardingManifest, BoardingPass, assertValidSeatId } from './seat';

export type BoardingTracePhase = 'scan' | 'bsp';

export const DEFAULT_MAX_TRACE_STEPS = 60;

/** Immutable frame describing either a manifest scan step or a BSP narrowing step. */
export class BoardingTraceFrame {
  readonly scannedCount: number;
  readonly totalPasses: number;
  readonly activePass: BoardingPass;
  readonly runningMinSeatId: number;
  readonly runningMaxSeatId: number;
  readonly result: SeatQueryResult;
  readonly bspStep: BspStep | null;

  constructor(
    scannedCount: number,
    totalPasses: number,
    activePass: BoardingPass,
    runningMinSeatId: number,
    runningMaxSeatId: number,
    result: SeatQueryResult,
    bspStep: BspStep | null,
  ) {
    if (!Number.isInteger(totalPasses) || totalPasses < 1) {
      throw new RangeError(`totalPasses must be >= 1, got ${totalPasses}`);
    }
    if (!Number.isInteger(scannedCount) || scannedCount < 1 || scannedCount > totalPasses) {
      throw new RangeError(`scannedCount must be in [1, ${totalPasses}], got ${scannedCount}`);
    }
    assertValidSeatId(runningMinSeatId);
    assertValidSeatId(runningMaxSeatId);
    if (runningMinSeatId > runningMaxSeatId) {
      throw new RangeError(`runningMinSeatId (${runningMinSeatId}) exceeds runningMaxSeatId (${runningMaxSeatId})`);
    }
    if (bspStep !== null && scannedCount !== totalPasses) {
      throw new RangeError('BSP frames require scannedCount === totalPasses');
    }
    this.scannedCount = scannedCount;
    this.totalPasses = totalPasses;
    this.activePass = activePass;
    this.runningMinSeatId = runningMinSeatId;
    this.runningMaxSeatId = runningMaxSeatId;
    this.result = result;
    this.bspStep = bspStep;
    Object.freeze(this);
  }

  get phase(): BoardingTracePhase {
    return this.bspStep === null ? 'scan' : 'bsp';
  }
}

function buildScanFrames(
  manifest: BoardingManifest,
  result: SeatQueryResult,
  scanBudget: number,
): BoardingTraceFrame[] {
  const indices = sampleTraceIndices(manifest.size, scanBudget);
  const frames: BoardingTraceFrame[] = [];
  let runningMin = (manifest.passes[0] as BoardingPass).seatId;
  let runningMax = runningMin;
  let cursor = 0;
  for (let i = 0; i < manifest.size; i += 1) {
    const pass = manifest.passes[i] as BoardingPass;
    runningMin = Math.min(runningMin, pass.seatId);
    runningMax = Math.max(runningMax, pass.seatId);
    if (indices[cursor] === i) {
      frames.push(new BoardingTraceFrame(i + 1, manifest.size, pass, runningMin, runningMax, result, null));
      cursor += 1;
    }
  }
  return frames;
}

/** Traces manifest scanning followed by BSP narrowing of the policy-selected seat. */
export function traceBoardingManifest(
  manifest: BoardingManifest,
  policy: SeatQueryPolicy,
  maxSteps?: number,
): readonly BoardingTraceFrame[] {
  const limit = validateMaxSteps(maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const occupancy = CabinOccupancy.fromManifest(manifest);
  const result = policy.query(occupancy);
  const bspSteps = traceSeatNarrowing(result.seat.code);
  const minId = occupancy.minSeatId as number;
  const maxId = occupancy.maxSeatId as number;

  const frames: BoardingTraceFrame[] =
    limit > bspSteps.length ? buildScanFrames(manifest, result, limit - bspSteps.length) : [];
  const bspIndices =
    limit > bspSteps.length ? sampleTraceIndices(bspSteps.length, bspSteps.length) : sampleTraceIndices(bspSteps.length, limit);

  for (const idx of bspIndices) {
    frames.push(
      new BoardingTraceFrame(manifest.size, manifest.size, result.seat, minId, maxId, result, bspSteps[idx] as BspStep),
    );
  }
  return Object.freeze(frames);
}
