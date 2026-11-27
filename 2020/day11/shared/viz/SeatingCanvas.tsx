import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { SeatGraph, SeatingLayout, SeatingTraceFrame, SeatVisualState } from '../index';
import { type CanvasGeom, computeCanvasGeom, renderSeatingCanvas } from './seatingCanvasDrawing';

export interface SeatingCanvasProps {
  readonly layout: SeatingLayout;
  readonly graph: SeatGraph;
  readonly frame: SeatingTraceFrame;
  readonly resetKey: string;
}

interface SeatSelection {
  readonly key: string;
  readonly hovered: number | null;
  readonly pinned: number | null;
}

const STATE_LABELS: Record<SeatVisualState, string> = {
  0: 'Empty (L)',
  1: 'Occupied (#)',
  2: 'Newly Occupied',
  3: 'Newly Vacated',
};

function seatAtPointer(event: MouseEvent<HTMLCanvasElement>, layout: SeatingLayout, geom: CanvasGeom): number | null {
  const rect = event.currentTarget.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  const col = Math.floor((((event.clientX - rect.left) * geom.width) / rect.width - geom.pad) / geom.cellSize);
  const row = Math.floor((((event.clientY - rect.top) * geom.height) / rect.height - geom.pad) / geom.cellSize);
  return layout.seatIndexAt(row, col);
}

function countOccupiedNeighbors(frame: SeatingTraceFrame, neighbors: readonly number[]): number {
  let occupied = 0;
  for (const idx of neighbors) {
    const state = frame.stateAt(idx);
    if (state === 1 || state === 2) occupied += 1;
  }
  return occupied;
}

function clampSeat(selection: SeatSelection, resetKey: string, seatCount: number): { pinned: number | null; hovered: number | null } {
  if (selection.key !== resetKey) return { pinned: null, hovered: null };
  return {
    pinned: selection.pinned !== null && selection.pinned < seatCount ? selection.pinned : null,
    hovered: selection.hovered !== null && selection.hovered < seatCount ? selection.hovered : null,
  };
}

function buildCaption(
  layout: SeatingLayout,
  graph: SeatGraph,
  frame: SeatingTraceFrame,
  inspectedSeat: number | null,
  isPinned: boolean,
): string {
  if (inspectedSeat === null) {
    return `Hover or click any seat to inspect its ${graph.rule.label.toLowerCase()} neighbors.`;
  }
  const coord = layout.coordOf(inspectedSeat);
  const neighbors = graph.neighborsOf(inspectedSeat);
  const occ = countOccupiedNeighbors(frame, neighbors);
  const pinLabel = isPinned ? ' [pinned]' : '';
  return `Seat (${coord.row}, ${coord.col}): ${STATE_LABELS[frame.stateAt(inspectedSeat)]} — ${occ}/${neighbors.length} visible occupied (vacates at >= ${graph.rule.crowdThreshold})${pinLabel}`;
}

/** Interactive HiDPI canvas rendering seating states and neighbor-ray inspection overlays. */
export function SeatingCanvas({ layout, graph, frame, resetKey }: SeatingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [selection, setSelection] = useState<SeatSelection>({ key: resetKey, hovered: null, pinned: null });
  const geom = computeCanvasGeom(layout);
  const active = clampSeat(selection, resetKey, layout.seatCount);
  const inspectedSeat = active.pinned ?? active.hovered;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) renderSeatingCanvas(canvas, layout, graph, frame, geom, inspectedSeat);
  }, [layout, graph, frame, geom, inspectedSeat]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={`Seating grid round ${frame.round} of ${frame.totalRounds}, ${frame.occupiedCount} occupied seats`}
        onMouseMove={(e) => setSelection({ key: resetKey, hovered: seatAtPointer(e, layout, geom), pinned: active.pinned })}
        onMouseLeave={() => setSelection({ key: resetKey, hovered: null, pinned: active.pinned })}
        onClick={(e) => {
          const clicked = seatAtPointer(e, layout, geom);
          setSelection({ key: resetKey, hovered: clicked, pinned: clicked === active.pinned ? null : clicked });
        }}
        style={{ width: '100%', maxWidth: `${geom.width}px`, height: 'auto', display: 'block', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'crosshair' }}
      />
      <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
        {buildCaption(layout, graph, frame, inspectedSeat, active.pinned !== null)}
      </p>
    </div>
  );
}
