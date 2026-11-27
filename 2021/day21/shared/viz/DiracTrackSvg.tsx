import { bigintLog2 } from '../../../../shared/core';
import type { PlayerId } from '../index';

export type DiracTrackOverlay =
  | {
      readonly kind: 'deterministic';
      readonly p1Pos: number;
      readonly p2Pos: number;
      readonly activePlayer: PlayerId | null;
      readonly winner: PlayerId | null;
      readonly rolls: readonly [number, number, number] | null;
    }
  | {
      readonly kind: 'quantum';
      readonly p1SpaceWeights: readonly bigint[];
      readonly p2SpaceWeights: readonly bigint[];
      readonly activePlayer: PlayerId | null;
      readonly p1Wins: bigint;
      readonly p2Wins: bigint;
    };

export interface DiracTrackSvgProps {
  readonly overlay: DiracTrackOverlay;
}

const CENTER = 180;
const TRACK_RADIUS = 122;
const SPACES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

function spaceCoords(space: number): { readonly x: number; readonly y: number } {
  const angle = -Math.PI / 2 + ((space - 1) * 2 * Math.PI) / 10;
  return { x: CENTER + TRACK_RADIUS * Math.cos(angle), y: CENTER + TRACK_RADIUS * Math.sin(angle) };
}

function PawnMarker({ x, y, label, color }: {
  readonly x: number;
  readonly y: number;
  readonly label: string;
  readonly color: string;
}) {
  return (
    <g>
      <circle cx={x} cy={y} r={11} fill={color} stroke="var(--surface)" strokeWidth={2} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--surface)">
        {label}
      </text>
    </g>
  );
}

function QuantumHalos({ x, y, w1, w2 }: {
  readonly x: number;
  readonly y: number;
  readonly w1: bigint;
  readonly w2: bigint;
}) {
  const r1 = w1 > 0n ? 22 + Math.min(18, bigintLog2(w1 + 1n) * 0.36) : 0;
  const r2 = w2 > 0n ? 25 + Math.min(20, bigintLog2(w2 + 1n) * 0.4) : 0;
  return (
    <g>
      {r1 > 0 && <circle cx={x} cy={y} r={r1} fill="none" stroke="var(--accent)" strokeWidth={2.5} opacity={0.8} />}
      {r2 > 0 && (
        <circle cx={x} cy={y} r={r2} fill="none" stroke="var(--warn)" strokeWidth={2} strokeDasharray="4 2" opacity={0.85} />
      )}
    </g>
  );
}

function TrackHub({ overlay }: { readonly overlay: DiracTrackOverlay }) {
  if (overlay.kind === 'deterministic') {
    const rollLine = overlay.rolls === null ? 'Initial State' : `${overlay.rolls[0]} + ${overlay.rolls[1]} + ${overlay.rolls[2]}`;
    const subLine =
      overlay.winner !== null
        ? `Winner: Player ${overlay.winner}`
        : overlay.activePlayer === null
          ? 'Ready to roll'
          : `Player ${overlay.activePlayer} moved`;
    const subColor = overlay.winner !== null ? 'var(--ok)' : 'var(--muted)';
    return (
      <g>
        <circle cx={CENTER} cy={CENTER} r={62} fill="var(--surface)" stroke="var(--border)" />
        <text x={CENTER} y={CENTER - 10} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">
          {rollLine}
        </text>
        <text x={CENTER} y={CENTER + 12} textAnchor="middle" fontSize={11.5} fontWeight={600} fill={subColor}>
          {subLine}
        </text>
      </g>
    );
  }
  const activeText = overlay.activePlayer === null ? 'Round 0' : `Player ${overlay.activePlayer} split`;
  return (
    <g>
      <circle cx={CENTER} cy={CENTER} r={62} fill="var(--surface)" stroke="var(--border)" />
      <text x={CENTER} y={CENTER - 8} textAnchor="middle" fontSize={12.5} fontWeight={700} fill="var(--text)">
        {activeText}
      </text>
      <text x={CENTER} y={CENTER + 12} textAnchor="middle" fontSize={10.5} fill="var(--muted)">
        27× multiverse
      </text>
    </g>
  );
}

/** Shared circular 10-space Dirac Dice board SVG for deterministic and quantum overlays. */
export function DiracTrackSvg({ overlay }: DiracTrackSvgProps) {
  return (
    <svg
      viewBox="0 0 360 360"
      role="img"
      aria-label="10-space circular Dirac Dice track"
      style={{ width: '100%', maxWidth: '360px', height: 'auto', display: 'block', margin: '0 auto' }}
    >
      <circle cx={CENTER} cy={CENTER} r={TRACK_RADIUS} fill="none" stroke="var(--border)" strokeWidth={3} />
      {SPACES.map((space) => {
        const { x, y } = spaceCoords(space);
        const isDet = overlay.kind === 'deterministic';
        const hasP1 = isDet && overlay.p1Pos === space;
        const hasP2 = isDet && overlay.p2Pos === space;
        const stroke = hasP1 ? 'var(--accent)' : hasP2 ? 'var(--warn)' : 'var(--border)';
        return (
          <g key={space}>
            {overlay.kind === 'quantum' && (
              <QuantumHalos x={x} y={y} w1={overlay.p1SpaceWeights[space - 1] ?? 0n} w2={overlay.p2SpaceWeights[space - 1] ?? 0n} />
            )}
            <circle cx={x} cy={y} r={20} fill="var(--surface)" stroke={stroke} strokeWidth={2.5} />
            <text x={x} y={y + 5} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--text)">
              {space}
            </text>
            {hasP1 && <PawnMarker x={hasP2 ? x - 14 : x} y={y - 23} label="P1" color="var(--accent)" />}
            {hasP2 && <PawnMarker x={hasP1 ? x + 14 : x} y={y + 23} label="P2" color="var(--warn)" />}
          </g>
        );
      })}
      <TrackHub overlay={overlay} />
    </svg>
  );
}
