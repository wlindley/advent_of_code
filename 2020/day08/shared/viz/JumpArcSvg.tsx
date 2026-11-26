import { useId } from 'react';
import type { JumpArcProjection } from '../index';

export const DEBUGGER_ROW_HEIGHT = 28;
const GUTTER_WIDTH = 64;
const EDGE_X = GUTTER_WIDTH - 6;

export interface JumpArcSvgProps {
  readonly jumpArc: JumpArcProjection | null;
  readonly visibleCount: number;
}

function rowCenterY(row: number): number {
  return row * DEBUGGER_ROW_HEIGHT + DEBUGGER_ROW_HEIGHT / 2;
}

function clippedEndpointY(pc: number, windowStart: number, totalHeight: number): number {
  return pc < windowStart ? 4 : totalHeight - 4;
}

function buildArcPath(jumpArc: JumpArcProjection, totalHeight: number): string {
  if (jumpArc.fromPc === jumpArc.toPc && !jumpArc.isFromClipped) {
    const y = rowCenterY(jumpArc.fromRow);
    return `M ${EDGE_X} ${y - 5} C ${EDGE_X - 30} ${y - 14}, ${EDGE_X - 30} ${y + 14}, ${EDGE_X} ${y + 5}`;
  }
  const y1 = jumpArc.isFromClipped
    ? clippedEndpointY(jumpArc.fromPc, jumpArc.windowStart, totalHeight)
    : rowCenterY(jumpArc.fromRow);
  const y2 = jumpArc.isToClipped
    ? clippedEndpointY(jumpArc.toPc, jumpArc.windowStart, totalHeight)
    : rowCenterY(jumpArc.toRow);
  const endX = jumpArc.isToClipped ? EDGE_X - 24 : EDGE_X;
  const pull = Math.min(46, 16 + Math.abs(jumpArc.toRow - jumpArc.fromRow) * 4);
  const cx = EDGE_X - pull;
  return `M ${EDGE_X} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${endX} ${y2}`;
}

/** SVG bezier jump-arc gutter aligned to fixed 28px debugger rows. */
export function JumpArcSvg({ jumpArc, visibleCount }: JumpArcSvgProps) {
  const markerId = useId();
  const totalHeight = visibleCount * DEBUGGER_ROW_HEIGHT;

  if (!jumpArc) {
    return <svg width={GUTTER_WIDTH} height={totalHeight} aria-hidden="true" style={{ flexShrink: 0 }} />;
  }

  const color = jumpArc.isBackward ? 'var(--warn)' : 'var(--accent)';
  const pathD = buildArcPath(jumpArc, totalHeight);
  const signed = jumpArc.delta >= 0 ? `+${jumpArc.delta}` : `${jumpArc.delta}`;
  const isClipped = jumpArc.isFromClipped || jumpArc.isToClipped;

  return (
    <svg
      width={GUTTER_WIDTH}
      height={totalHeight}
      role="img"
      aria-label={`Jump from line ${jumpArc.fromPc} to line ${jumpArc.toPc}`}
      style={{ flexShrink: 0, overflow: 'visible' }}
    >
      <title>{`Jump pc ${jumpArc.fromPc} -> ${jumpArc.toPc} (${signed})`}</title>
      <defs>
        <marker id={markerId} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill={color} />
        </marker>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray={isClipped ? '4 3' : undefined}
        markerEnd={`url(#${markerId})`}
      />
    </svg>
  );
}
