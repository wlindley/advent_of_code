import type { CupMoveRecord } from './ring';
import type { CrabCupsTraceFrame } from './trace';

export const SVG_WIDTH = 760;
export const SVG_HEIGHT = 340;
export const RING_CX = 210;
export const RING_CY = 172;
export const RING_R = 118;

export type CupRole = 'current' | 'destination' | 'picked' | 'normal';

export interface RingNodeProjection {
  readonly cup: number;
  readonly x: number;
  readonly y: number;
  readonly role: CupRole;
  readonly isAnchorOne: boolean;
}

export interface SpliceArcProjection {
  readonly sourceCup: number;
  readonly destination: number;
  readonly pickedUp: readonly [number, number, number];
  readonly didWrap: boolean;
  readonly path: string;
}

export interface RibbonChipProjection {
  readonly cup: number;
  readonly role: CupRole;
  readonly isAnchorOne: boolean;
  readonly isStarCup: boolean;
}

interface ProjectionBase {
  readonly move: number;
  readonly totalMoves: number;
  readonly cupCount: number;
  readonly currentCup: number;
  readonly isFinal: boolean;
  readonly lastMove: CupMoveRecord | null;
  readonly didWrap: boolean;
}

export type CrabCupsProjection =
  | (ProjectionBase & {
      readonly mode: 'ring';
      readonly nodes: readonly RingNodeProjection[];
      readonly spliceArc: SpliceArcProjection | null;
      readonly labelsAfterOne: string | null;
    })
  | (ProjectionBase & {
      readonly mode: 'ribbon';
      readonly anchorRibbon: readonly RibbonChipProjection[];
      readonly currentRibbon: readonly RibbonChipProjection[];
      readonly productAfterOne: bigint;
    });

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function classifyRole(cup: number, frame: CrabCupsTraceFrame): CupRole {
  if (cup === frame.currentCup) return 'current';
  if (frame.lastMove !== null) {
    if (cup === frame.lastMove.destination) return 'destination';
    const [p1, p2, p3] = frame.lastMove.pickedUp;
    if (cup === p1 || cup === p2 || cup === p3) return 'picked';
  }
  return 'normal';
}

function buildSpliceArc(nodes: readonly RingNodeProjection[], frame: CrabCupsTraceFrame): SpliceArcProjection | null {
  if (frame.lastMove === null) return null;
  const byCup = new Map(nodes.map((node) => [node.cup, node]));
  const src = byCup.get(frame.lastMove.sourceCup)!;
  const dst = byCup.get(frame.lastMove.destination)!;
  const midX = (src.x + dst.x) / 2;
  const midY = (src.y + dst.y) / 2;
  const ctrlX = round1(midX + (RING_CX - midX) * 0.45);
  const ctrlY = round1(midY + (RING_CY - midY) * 0.45);
  return Object.freeze({
    sourceCup: frame.lastMove.sourceCup,
    destination: frame.lastMove.destination,
    pickedUp: frame.lastMove.pickedUp,
    didWrap: frame.didWrap,
    path: `M ${src.x} ${src.y} Q ${ctrlX} ${ctrlY} ${dst.x} ${dst.y}`,
  });
}

function baseProjection(frame: CrabCupsTraceFrame): ProjectionBase {
  return {
    move: frame.move, totalMoves: frame.totalMoves, cupCount: frame.cupCount,
    currentCup: frame.currentCup, isFinal: frame.isFinal, lastMove: frame.lastMove, didWrap: frame.didWrap,
  };
}

function projectRingMode(frame: CrabCupsTraceFrame): CrabCupsProjection {
  const count = frame.windowFromOne.length;
  const nodes = Object.freeze(frame.windowFromOne.map((cup, idx) => {
    const angle = -Math.PI / 2 + (2 * Math.PI * idx) / count;
    return Object.freeze({
      cup,
      x: round1(RING_CX + RING_R * Math.cos(angle)),
      y: round1(RING_CY + RING_R * Math.sin(angle)),
      role: classifyRole(cup, frame),
      isAnchorOne: cup === 1,
    });
  }));
  return Object.freeze({
    ...baseProjection(frame), mode: 'ring', nodes,
    spliceArc: buildSpliceArc(nodes, frame), labelsAfterOne: frame.labelsAfterOne,
  });
}

function toChip(cup: number, frame: CrabCupsTraceFrame, isStarCup: boolean): RibbonChipProjection {
  return Object.freeze({ cup, role: classifyRole(cup, frame), isAnchorOne: cup === 1, isStarCup });
}

function projectRibbonMode(frame: CrabCupsTraceFrame): CrabCupsProjection {
  const anchorRibbon = Object.freeze(frame.windowFromOne.map((cup, idx) => toChip(cup, frame, idx === 1 || idx === 2)));
  const currentRibbon = Object.freeze(frame.windowFromCurrent.map((cup) => toChip(cup, frame, false)));
  return Object.freeze({
    ...baseProjection(frame), mode: 'ribbon', anchorRibbon, currentRibbon, productAfterOne: frame.productAfterOne,
  });
}

/** Projects a CrabCupsTraceFrame into a circular ring (<=20 cups) or dual ribbon (>20 cups). */
export function projectCrabCups(frame: CrabCupsTraceFrame): CrabCupsProjection {
  return frame.isFullRing ? projectRingMode(frame) : projectRibbonMode(frame);
}
