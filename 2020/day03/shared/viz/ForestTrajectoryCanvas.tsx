import { useEffect, useRef } from 'react';
import type { ForestMap, TrajectoryTraceFrame } from '../index';
import { renderTrajectoryCanvas } from './canvasDrawing';

export interface ForestTrajectoryCanvasProps {
  readonly forest: ForestMap;
  readonly frame: TrajectoryTraceFrame;
  readonly focusedIndex: number;
}

function buildCanvasAriaLabel(frame: TrajectoryTraceFrame, focusedIndex: number): string {
  const progress = frame.slopes[focusedIndex] ?? frame.slopes[0]!;
  const landing = progress.activeLanding;
  if (!landing) {
    return `Row ${frame.row + 1} of ${frame.totalRows} for ${progress.slope.label}, ${progress.treeCount} trees hit`;
  }
  const hitLabel = landing.isTree ? 'tree hit' : 'open ground';
  return `Row ${frame.row + 1} of ${frame.totalRows}, ${progress.slope.label}, col ${landing.col} wraps to ${landing.wrappedCol}, ${hitLabel}`;
}

/** Responsive high-DPI canvas rendering base tile, unwrapped corridor, and depth minimap. */
export function ForestTrajectoryCanvas({ forest, frame, focusedIndex }: ForestTrajectoryCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      renderTrajectoryCanvas(canvas, forest, frame, focusedIndex);
    }
  }, [forest, frame, focusedIndex]);

  const progress = frame.slopes[focusedIndex] ?? frame.slopes[0]!;
  const landing = progress.activeLanding;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={buildCanvasAriaLabel(frame, focusedIndex)}
        style={{
          width: '100%',
          maxWidth: '720px',
          height: 'auto',
          display: 'block',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: 'var(--bg)',
        }}
      />
      <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
        {landing
          ? `Landing #${landing.stepIndex}: row ${landing.row}, col ${landing.col} -> wrapped col ${landing.wrappedCol} (tile #${landing.tileRepeat + 1}) — ${landing.isTree ? 'Tree (#)' : 'Open (.)'}`
          : frame.row === 0
            ? 'Start position (0, 0): first landing occurs after stepping down.'
            : `Row ${frame.row}: ${progress.slope.label} passes over without landing here.`}
      </p>
    </div>
  );
}
