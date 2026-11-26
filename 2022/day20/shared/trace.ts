import { sampleTraceIndices, type TraceOptions, validateMaxSteps } from '../../../shared/core';
import { type MoveSpan, SqrtCircularList } from './circularList';
import {
  type EncryptedFile,
  type GroveCoordinates,
  type MixConfig,
  validateMixConfig,
} from './encryptedFile';
import { extractGroveCoordinates } from './mixer';

export const DEFAULT_TRACE_MAX_STEPS = 160;
export const MAX_VISIBLE_SLOTS = 64;

/** One ring slot exposed to the visualizer, preserving coincident grove ordinals. */
export interface VisibleRingSlot {
  readonly ringIndex: number;
  readonly id: number;
  readonly value: bigint;
  readonly isZero: boolean;
  readonly groveOrdinals: readonly (1 | 2 | 3)[];
  readonly isActive: boolean;
}

/** One playback snapshot along the circular mixing simulation. */
export interface MixingTraceFrame {
  readonly round: number;
  readonly stepInRound: number;
  readonly totalRounds: number;
  readonly moveCount: number;
  readonly totalMoves: number;
  readonly ringLength: number;
  readonly activeId: number | null;
  readonly activeValue: bigint | null;
  readonly lastMove: MoveSpan | null;
  readonly coordinates: GroveCoordinates;
  readonly finalSum: bigint;
  readonly slots: readonly VisibleRingSlot[];
  readonly isSampled: boolean;
}

function ordinalsForIndex(
  ringIndex: number,
  offsetIndices: readonly [number, number, number],
): readonly (1 | 2 | 3)[] {
  const ordinals: (1 | 2 | 3)[] = [];
  if (offsetIndices[0] === ringIndex) ordinals.push(1);
  if (offsetIndices[1] === ringIndex) ordinals.push(2);
  if (offsetIndices[2] === ringIndex) ordinals.push(3);
  return Object.freeze(ordinals);
}

function selectVisibleIndices(
  ringLength: number,
  coordinates: GroveCoordinates,
  lastMove: MoveSpan | null,
): readonly number[] {
  if (ringLength <= MAX_VISIBLE_SLOTS) {
    return Array.from({ length: ringLength }, (_, i) => i);
  }
  const indices = new Set<number>([coordinates.zeroIndex, ...coordinates.offsetIndices]);
  if (lastMove !== null) indices.add(lastMove.toIndex);
  let k = 0;
  while (indices.size < MAX_VISIBLE_SLOTS) {
    let candidate = Math.floor((k * ringLength) / MAX_VISIBLE_SLOTS);
    while (indices.has(candidate)) {
      candidate = (candidate + 1) % ringLength;
    }
    indices.add(candidate);
    k += 1;
  }
  return Array.from(indices).sort((a, b) => a - b);
}

function buildVisibleSlots(
  order: readonly number[],
  scaled: readonly bigint[],
  coordinates: GroveCoordinates,
  activeId: number | null,
  lastMove: MoveSpan | null,
): readonly VisibleRingSlot[] {
  const indices = selectVisibleIndices(order.length, coordinates, lastMove);
  return Object.freeze(
    indices.map((ringIndex) => {
      const id = order[ringIndex]!;
      const value = scaled[id]!;
      return Object.freeze({
        ringIndex,
        id,
        value,
        isZero: value === 0n,
        groveOrdinals: ordinalsForIndex(ringIndex, coordinates.offsetIndices),
        isActive: id === activeId,
      });
    }),
  );
}

type DraftFrame = Omit<MixingTraceFrame, 'totalRounds' | 'totalMoves' | 'ringLength' | 'finalSum' | 'isSampled'>;

function captureDraft(
  ring: SqrtCircularList,
  file: EncryptedFile,
  scaled: readonly bigint[],
  key: bigint,
  round: number,
  stepInRound: number,
  moveCount: number,
  activeId: number | null,
  lastMove: MoveSpan | null,
): DraftFrame {
  const order = ring.toOrder();
  const coordinates = extractGroveCoordinates(order, file, key);
  const slots = buildVisibleSlots(order, scaled, coordinates, activeId, lastMove);
  const activeValue = activeId === null ? null : scaled[activeId]!;
  return { round, stepInRound, moveCount, activeId, activeValue, lastMove, coordinates, slots };
}

function finalizeFrames(
  drafts: readonly DraftFrame[],
  totalRounds: number,
  totalMoves: number,
  ringLength: number,
): readonly MixingTraceFrame[] {
  const finalSum = drafts[drafts.length - 1]!.coordinates.sum;
  const isSampled = ringLength > MAX_VISIBLE_SLOTS;
  return Object.freeze(
    drafts.map((d) => Object.freeze({ ...d, totalRounds, totalMoves, ringLength, finalSum, isSampled })),
  );
}

/** Builds a bounded playback trace of circular mixing steps and landmark-preserving ring slots. */
export function buildMixingTrace(
  file: EncryptedFile,
  config: MixConfig,
  options?: TraceOptions,
): readonly MixingTraceFrame[] {
  validateMixConfig(config);
  const maxSteps = validateMaxSteps(options?.maxSteps, DEFAULT_TRACE_MAX_STEPS);
  const totalMoves = config.rounds * file.length;
  const sampled = new Set(sampleTraceIndices(1 + totalMoves, maxSteps));
  const scaled = file.scaledValues(config.decryptionKey);
  const ring = new SqrtCircularList(file.length, config.blockSize);
  const drafts: DraftFrame[] = [];
  if (sampled.has(0)) {
    drafts.push(captureDraft(ring, file, scaled, config.decryptionKey, 0, 0, 0, null, null));
  }
  let moveCount = 0;
  for (let round = 1; round <= config.rounds; round += 1) {
    for (let id = 0; id < file.length; id += 1) {
      moveCount += 1;
      const lastMove = ring.move(id, scaled[id]!);
      if (sampled.has(moveCount)) {
        drafts.push(captureDraft(ring, file, scaled, config.decryptionKey, round, id + 1, moveCount, id, lastMove));
      }
    }
  }
  return finalizeFrames(drafts, config.rounds, totalMoves, file.length);
}
