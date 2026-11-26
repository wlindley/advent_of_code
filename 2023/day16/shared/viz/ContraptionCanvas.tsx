import { useEffect, useRef } from 'react';
import type { BeamState, BeamWaveFrame, Contraption, EdgeBeamScore } from '../index';
import { CANVAS_RIM, drawContraptionScene, readThemeColors } from './contraptionDrawing';

export interface ContraptionCanvasProps {
  readonly contraption: Contraption;
  readonly frame: BeamWaveFrame;
  readonly edgeScores?: readonly EdgeBeamScore[];
  readonly optimalEntry?: BeamState;
  readonly ariaLabel?: string;
}

/** Responsive HiDPI Canvas renderer for optical contraption grids and beam wavefronts. */
export function ContraptionCanvas({
  contraption,
  frame,
  edgeScores,
  optimalEntry,
  ariaLabel,
}: ContraptionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maxDim = Math.max(contraption.height, contraption.width);
  const cell = Math.max(4, Math.min(34, Math.floor(560 / maxDim)));
  const cssW = contraption.width * cell + CANVAS_RIM * 2;
  const cssH = contraption.height * cell + CANVAS_RIM * 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawContraptionScene(
      ctx,
      contraption,
      frame,
      cell,
      readThemeColors(canvas),
      edgeScores,
      optimalEntry,
    );
  }, [contraption, frame, edgeScores, optimalEntry, cell, cssW, cssH]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={
        ariaLabel ??
        `Contraption ${contraption.height} by ${contraption.width}, wave ${frame.wave + 1} of ${frame.totalWaves}, ${frame.energizedCount} energized`
      }
      style={{
        width: '100%',
        maxWidth: `${cssW}px`,
        height: 'auto',
        display: 'block',
        margin: '0 auto',
        background: 'var(--surface)',
      }}
    />
  );
}
