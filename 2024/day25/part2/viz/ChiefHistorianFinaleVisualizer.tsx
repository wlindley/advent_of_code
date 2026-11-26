import { useMemo } from 'react';
import type { FinaleStarNode } from '../../../../shared/core';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import { solver, TOTAL_2024_STARS } from '../domain';

function starPosition(node: FinaleStarNode): { x: number; y: number } {
  if (node.isTopper) return { x: 260, y: 36 };
  const idx = node.starNumber - 1;
  return { x: 80 + (idx % 7) * 60, y: 84 + Math.floor(idx / 7) * 34 };
}

export function ChiefHistorianFinaleVisualizer({ rawInput }: VisualizerProps) {
  const frames = useMemo(() => solver.trace(solver.parse(rawInput)), [rawInput]);
  const pb = usePlayback(frames.length, rawInput, 80);
  const frame = frames[Math.min(pb.step, frames.length - 1)]!;

  return (
    <div className="stack">
      <div className="meta-row">
        <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
          ★ {frame.litStars} / {TOTAL_2024_STARS} Stars Lit
        </span>
        <span className="badge">Advent of Code 2024 Complete (50/50 First-Try)</span>
      </div>
      <svg
        viewBox="0 0 520 330"
        role="img"
        aria-label={`2024 finale illumination: ${frame.litStars} of 50 stars lit`}
        style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto' }}
      >
        <rect x={44} y={60} width={432} height={254} rx={12} fill="var(--bg)" stroke="var(--border)" />
        {frame.nodes.map((node) => {
          const { x, y } = starPosition(node);
          const lit = node.starNumber <= frame.litStars;
          return (
            <g key={node.starNumber}>
              <circle
                cx={x}
                cy={y}
                r={node.isTopper ? 16 : 11}
                fill={lit ? (node.isTopper ? 'var(--accent)' : 'var(--gold)') : 'var(--surface)'}
                stroke={lit ? 'var(--gold)' : 'var(--border)'}
                strokeWidth={node.isTopper ? 2.5 : 1.5}
              />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={node.isTopper ? 13 : 9} fill={lit ? '#fff' : 'var(--muted)'}>
                {node.isTopper ? '★' : `${node.day}`}
              </text>
              <title>{`Star #${node.starNumber} — Day ${node.day} Part ${node.part}`}</title>
            </g>
          );
        })}
      </svg>
      <PlaybackControls
        step={pb.step}
        totalSteps={frames.length}
        isPlaying={pb.isPlaying}
        speedMs={pb.speedMs}
        onStepChange={pb.setStep}
        onTogglePlay={pb.togglePlay}
        onSpeedChange={pb.setSpeedMs}
      />
    </div>
  );
}
