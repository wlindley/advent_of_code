import {
  TILE_SIZE,
  type HullTileLayout,
  type SensorPinLayout,
  type SpringdroidSvgLayout,
  type SpringdroidTraceFrame,
} from '../index';

interface HullDiagramSvgProps {
  readonly frame: SpringdroidTraceFrame;
  readonly layout: SpringdroidSvgLayout;
}

function renderTile(tile: HullTileLayout) {
  const stroke = tile.solid ? (tile.virtual ? 'var(--border)' : 'var(--text)') : 'var(--err)';
  const fill = tile.solid ? (tile.virtual ? 'var(--bg)' : 'var(--surface)') : 'var(--bg)';
  const label = tile.solid ? (tile.virtual ? '·' : '#') : '×';
  const textColor = tile.solid ? (tile.virtual ? 'var(--muted)' : 'var(--text)') : 'var(--err)';

  return (
    <g key={tile.index}>
      <rect
        x={tile.x}
        y={tile.y}
        width={TILE_SIZE}
        height={TILE_SIZE}
        rx={5}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.5}
        strokeDasharray={tile.virtual || !tile.solid ? '4 3' : undefined}
      />
      <text x={tile.x + TILE_SIZE / 2} y={tile.y + 22} textAnchor="middle" fill={textColor} fontSize={14} fontWeight={700}>
        {label}
      </text>
    </g>
  );
}

function renderSensorPin(pin: SensorPinLayout) {
  const color = pin.solid ? 'var(--ok)' : 'var(--err)';
  return (
    <g key={pin.register}>
      <line x1={pin.x} y1={pin.y - 24} x2={pin.x} y2={pin.y - 12} stroke={color} strokeWidth={1.4} />
      <circle cx={pin.x} cy={pin.y - 2} r={10} fill="var(--surface)" stroke={color} strokeWidth={1.6} />
      <text x={pin.x} y={pin.y + 2} textAnchor="middle" fill={color} fontSize={11} fontWeight={700}>
        {pin.register}
      </text>
    </g>
  );
}

function DiagramSvgBody({ layout }: { readonly layout: SpringdroidSvgLayout }) {
  const actionColor = layout.isJump ? 'var(--accent)' : 'var(--ok)';
  return (
    <svg
      viewBox={layout.viewBox}
      role="img"
      aria-label="Springdroid hull tiles, sensors, and trajectory"
      style={{ width: '100%', height: 'auto', display: 'block', background: 'var(--bg)', borderRadius: '6px', border: '1px solid var(--border)' }}
    >
      {layout.tiles.map(renderTile)}
      <path d={layout.arcPath} fill="none" stroke={actionColor} strokeWidth={2.5} strokeDasharray={layout.isJump ? '5 3' : undefined} />
      <circle cx={layout.targetX} cy={layout.targetY} r={4} fill={actionColor} />
      <circle cx={layout.droidX} cy={layout.droidY} r={11} fill="var(--gold)" stroke="var(--text)" strokeWidth={1.8} />
      <text x={layout.droidX} y={layout.droidY + 4} textAnchor="middle" fill="var(--surface)" fontSize={11} fontWeight={700}>
        @
      </text>
      {layout.sensorPins.map(renderSensorPin)}
    </svg>
  );
}

/** Light-mode SVG diagram of hull tiles, sensor pins, droid marker, and jump/walk path. */
export function HullDiagramSvg({ frame, layout }: HullDiagramSvgProps) {
  const actionLabel = layout.isJump ? 'JUMP (+4)' : 'WALK (+1)';
  const actionColor = layout.isJump ? 'var(--accent)' : 'var(--ok)';

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: '8px', padding: '0.65rem', background: 'var(--surface)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem', fontSize: '0.82rem' }}>
        <span>
          Scenario {frame.scenarioIndex + 1} / {frame.scenarioCount} ·{' '}
          <strong style={{ color: actionColor }}>{actionLabel}</strong>
        </span>
        <span className="muted">
          Pos {frame.tick.position} → {frame.tick.nextPosition} ({frame.tick.landedSafe ? 'safe' : 'fall'})
        </span>
      </div>
      <DiagramSvgBody layout={layout} />
    </div>
  );
}
