import { useEffect, useRef } from 'react';
import type { CrucibleTraceFrame, HeatMap } from '../index';
import { CANVAS_RIM, drawCrucibleScene, readThemeColors } from './crucibleDrawing';

export interface CrucibleCanvasProps {
  readonly map: HeatMap;
  readonly frame: CrucibleTraceFrame;
  readonly prevThreshold: number;
  readonly ariaLabel?: string;
}

/** Responsive HiDPI Canvas renderer for the thermal grid, iso-heat wavefront, and optimal path. */
export function CrucibleCanvas({ map, frame, prevThreshold, ariaLabel }: CrucibleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const maxDim = Math.max(map.height, map.width);
  const cell = Math.max(4, Math.min(34, Math.floor(560 / maxDim)));
  const cssW = map.width * cell + CANVAS_RIM * 2;
  const cssH = map.height * cell + CANVAS_RIM * 2;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawCrucibleScene(ctx, map, frame, prevThreshold, cell, readThemeColors(canvas));
  }, [map, frame, prevThreshold, cell, cssW, cssH]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={
        ariaLabel ??
        `Crucible thermal grid ${map.height} by ${map.width}, heat wave ${frame.heatThreshold} of ${frame.result.goalHeat}, ${frame.settledCount} cells settled`
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
