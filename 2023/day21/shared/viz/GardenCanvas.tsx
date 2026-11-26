import { useEffect, useMemo, useRef } from 'react';
import type { FiniteDistanceMap, GardenMap, GardenTraceFrame } from '../index';
import { computeCanvasLayout, drawGardenFrame, GARDEN_COLORS } from './gardenDrawing';

export interface GardenCanvasProps {
  readonly map: GardenMap;
  readonly distMap: FiniteDistanceMap;
  readonly frame: GardenTraceFrame;
}

const LEGEND_ITEMS: readonly { readonly label: string; readonly color: string }[] = [
  { label: 'Reachable', color: GARDEN_COLORS.reachable },
  { label: 'Wavefront', color: GARDEN_COLORS.wavefront },
  { label: 'Opposite parity', color: GARDEN_COLORS.exploredOpposite },
  { label: 'Unvisited', color: GARDEN_COLORS.unvisited },
  { label: 'Rock (#)', color: GARDEN_COLORS.rock },
  { label: 'Start (S)', color: GARDEN_COLORS.start },
];

/** HiDPI canvas renderer for garden BFS expansion and parity legend. */
export function GardenCanvas({ map, distMap, frame }: GardenCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const layout = useMemo(() => computeCanvasLayout(map), [map]);
  const isIsolated = frame.step > 0 && frame.reachableCount === 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(layout.width * dpr);
    canvas.height = Math.round(layout.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawGardenFrame(ctx, map, distMap, frame, layout);
  }, [map, distMap, frame, layout]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', alignItems: 'flex-start' }}>
      <canvas
        ref={canvasRef}
        aria-label={`Garden grid ${map.width} by ${map.height} at step ${frame.step}`}
        style={{
          width: `${layout.width}px`,
          maxWidth: '100%',
          height: 'auto',
          borderRadius: '8px',
          border: '1px solid var(--border)',
          background: GARDEN_COLORS.unvisited,
        }}
      />
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', fontSize: '0.8rem', color: 'var(--text)' }}>
        {LEGEND_ITEMS.map((item) => (
          <span key={item.label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: '12px',
                height: '12px',
                borderRadius: '3px',
                background: item.color,
                border: '1px solid var(--border)',
                display: 'inline-block',
              }}
            />
            {item.label}
          </span>
        ))}
      </div>
      {isIsolated && (
        <p className="muted" style={{ margin: 0, fontSize: '0.82rem' }}>
          Start position S is boxed in by rocks with no open orthogonal neighbor; 0 plots remain reachable after step 0.
        </p>
      )}
    </div>
  );
}
