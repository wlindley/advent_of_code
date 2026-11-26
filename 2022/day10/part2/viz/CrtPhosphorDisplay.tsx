import { CRT_HEIGHT, CRT_WIDTH } from '../../shared';
import { GLYPH_COUNT, GLYPH_WIDTH, type CrtBeamTraceFrame, type SlotDecodeState } from '../domain';

export interface CrtPhosphorDisplayProps {
  readonly pixels: readonly boolean[];
  readonly frame: CrtBeamTraceFrame;
}

const CELL = 16;
const PAD_X = 12;
const PAD_Y = 12;
const GRID_W = CRT_WIDTH * CELL;
const GRID_H = CRT_HEIGHT * CELL;
const SPRITE_Y = PAD_Y + GRID_H + 14;
const SVG_W = GRID_W + PAD_X * 2;
const SVG_H = SPRITE_Y + 28;

function slotStyle(slot: SlotDecodeState) {
  const isDecoded = slot.status === 'decoded';
  const isUnknown = slot.status === 'unknown';
  return {
    textAlign: 'center' as const,
    padding: '0.3rem 0.25rem',
    borderRadius: '6px',
    border: `1.5px solid ${isDecoded ? 'var(--ok)' : isUnknown ? 'var(--gold)' : 'var(--border)'}`,
    background: 'var(--surface)',
    color: isDecoded ? 'var(--ok)' : isUnknown ? 'var(--gold)' : 'var(--muted)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    fontSize: '1.05rem',
    fontWeight: 700,
  };
}

function slotChar(slot: SlotDecodeState): string {
  if (slot.status === 'decoded') return slot.letter;
  return slot.status === 'unknown' ? '?' : '_';
}

function CrtCells({ pixels, frame }: CrtPhosphorDisplayProps) {
  const activeBeamCycle = frame.cycle <= CRT_WIDTH * CRT_HEIGHT ? frame.cycle : -1;
  const cells = [];
  for (let row = 0; row < CRT_HEIGHT; row += 1) {
    for (let col = 0; col < CRT_WIDTH; col += 1) {
      const cycle = row * CRT_WIDTH + col + 1;
      const drawn = cycle <= frame.drawnPixelCount && cycle <= pixels.length;
      const lit = drawn && Boolean(pixels[cycle - 1]);
      const isBeam = cycle === activeBeamCycle;
      const fill = lit ? 'var(--ok)' : drawn ? 'var(--border)' : 'var(--surface)';
      cells.push(
        <rect
          key={cycle}
          x={PAD_X + col * CELL + 1}
          y={PAD_Y + row * CELL + 1}
          width={CELL - 2}
          height={CELL - 2}
          rx={3}
          fill={fill}
          fillOpacity={lit ? 0.92 : drawn ? 0.45 : 1}
          stroke={isBeam ? 'var(--accent)' : 'var(--border)'}
          strokeWidth={isBeam ? 2 : 0.6}
        />,
      );
    }
  }
  return <>{cells}</>;
}

function SpriteBracketRow({ frame }: { readonly frame: CrtBeamTraceFrame }) {
  const xDuring = frame.snapshot.xDuring;
  const beamCol = frame.cycle <= CRT_WIDTH * CRT_HEIGHT ? frame.snapshot.crtCol : -1;
  const cols = [];
  for (let col = 0; col < CRT_WIDTH; col += 1) {
    const inSprite = Math.abs(col - xDuring) <= 1;
    const isBeam = col === beamCol;
    cols.push(
      <rect
        key={col}
        x={PAD_X + col * CELL + 1}
        y={SPRITE_Y}
        width={CELL - 2}
        height={10}
        rx={2}
        fill={inSprite ? 'var(--gold)' : 'var(--surface)'}
        fillOpacity={inSprite ? 0.85 : 1}
        stroke={isBeam ? 'var(--accent)' : 'var(--border)'}
        strokeWidth={isBeam ? 1.8 : 0.6}
      />,
    );
  }
  return (
    <g aria-label={`Sprite position centered at X = ${xDuring}`}>
      {cols}
      <text x={PAD_X} y={SPRITE_Y + 23} fontSize={10} fill="var(--muted)" fontFamily="monospace">
        Sprite [X-1, X, X+1] = [{xDuring - 1}, {xDuring}, {xDuring + 1}]
      </text>
    </g>
  );
}

function OcrSlotRibbon({ slots }: { readonly slots: readonly SlotDecodeState[] }) {
  return (
    <div style={{ marginTop: '0.55rem' }}>
      <div className="eyebrow">8-Slot Progressive OCR Ribbon</div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GLYPH_COUNT}, minmax(0, 1fr))`,
          gap: '0.4rem',
          marginTop: '0.25rem',
        }}
      >
        {slots.map((slot, idx) => (
          <div key={idx} style={slotStyle(slot)} title={`Slot ${idx + 1}: ${slot.status}`}>
            <div style={{ fontSize: '0.62rem', color: 'var(--muted)', fontWeight: 500 }}>
              #{idx + 1}
            </div>
            <div>{slotChar(slot)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlotDividers() {
  return (
    <>
      {Array.from({ length: GLYPH_COUNT - 1 }, (_, i) => {
        const x = PAD_X + (i + 1) * GLYPH_WIDTH * CELL;
        return (
          <line
            key={i}
            x1={x}
            y1={PAD_Y - 3}
            x2={x}
            y2={PAD_Y + GRID_H + 3}
            stroke="var(--border)"
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
        );
      })}
    </>
  );
}

const monitorCardStyle = {
  border: '1px solid var(--border)',
  borderRadius: '8px',
  padding: '0.65rem',
  background: 'var(--surface)',
  marginTop: '0.6rem',
} as const;

/** 40x6 CRT phosphor SVG monitor, aligned 40-column sprite bracket, and 8-slot OCR ribbon. */
export function CrtPhosphorDisplay({ pixels, frame }: CrtPhosphorDisplayProps) {
  return (
    <div style={monitorCardStyle}>
      <div className="eyebrow">40×6 Phosphor CRT Raster ({frame.drawnPixelCount} / 240 px)</div>
      <svg
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        role="img"
        aria-label="40 by 6 CRT raster display and 3-pixel sprite bracket"
        style={{ width: '100%', height: 'auto', display: 'block', marginTop: '0.35rem' }}
      >
        <rect x={1} y={1} width={SVG_W - 2} height={SVG_H - 2} rx={8} fill="var(--bg)" stroke="var(--border)" />
        <CrtCells pixels={pixels} frame={frame} />
        <SlotDividers />
        <SpriteBracketRow frame={frame} />
      </svg>
      <OcrSlotRibbon slots={frame.slots} />
    </div>
  );
}
