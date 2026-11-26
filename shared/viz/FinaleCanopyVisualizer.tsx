import { useMemo } from 'react';
import { createFinaleSolver, type FinaleStarNode, type FinaleTraceFrame } from '../core';
import { PlaybackControls } from './PlaybackControls';
import { usePlayback } from './usePlayback';

export interface FinaleCanopyVisualizerProps {
  readonly rawInput: string;
  readonly year: number;
  readonly totalStars: number;
  readonly badgeText: string;
}

interface StarNodeSvgProps {
  readonly node: FinaleStarNode;
  readonly lit: boolean;
}

interface CanopySvgProps {
  readonly year: number;
  readonly totalStars: number;
  readonly frame: FinaleTraceFrame;
}

function starPosition(node: FinaleStarNode): { x: number; y: number } {
  if (node.isTopper) return { x: 260, y: 36 };
  const idx = node.starNumber - 1;
  return { x: 80 + (idx % 7) * 60, y: 84 + Math.floor(idx / 7) * 34 };
}

function buildFinaleFrames(rawInput: string, totalStars: number): readonly FinaleTraceFrame[] {
  const solver = createFinaleSolver(totalStars);
  return solver.trace(solver.parse(rawInput));
}

function StarNodeSvg({ node, lit }: StarNodeSvgProps) {
  const { x, y } = starPosition(node);
  const fill = lit ? (node.isTopper ? 'var(--accent)' : 'var(--gold)') : 'var(--surface)';
  return (
    <g>
      <circle
        cx={x}
        cy={y}
        r={node.isTopper ? 16 : 11}
        fill={fill}
        stroke={lit ? 'var(--gold)' : 'var(--border)'}
        strokeWidth={node.isTopper ? 2.5 : 1.5}
      />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={node.isTopper ? 13 : 9} fill={lit ? '#fff' : 'var(--muted)'}>
        {node.isTopper ? '★' : `${node.day}`}
      </text>
      <title>{`Star #${node.starNumber} — Day ${node.day} Part ${node.part}`}</title>
    </g>
  );
}

function CanopySvg({ year, totalStars, frame }: CanopySvgProps) {
  const rows = Math.ceil((totalStars - 1) / 7);
  const rectHeight = rows * 34 + 16;
  const svgHeight = 60 + rectHeight + 16;
  return (
    <svg
      viewBox={`0 0 520 ${svgHeight}`}
      role="img"
      aria-label={`${year} finale illumination: ${frame.litStars} of ${totalStars} stars lit`}
      style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0 auto' }}
    >
      <rect x={44} y={60} width={432} height={rectHeight} rx={12} fill="var(--bg)" stroke="var(--border)" />
      {frame.nodes.map((node) => (
        <StarNodeSvg key={node.starNumber} node={node} lit={node.starNumber <= frame.litStars} />
      ))}
    </svg>
  );
}

/** Reusable Advent of Code finale star-canopy illumination visualizer. */
export function FinaleCanopyVisualizer({ rawInput, year, totalStars, badgeText }: FinaleCanopyVisualizerProps) {
  const frames = useMemo(() => buildFinaleFrames(rawInput, totalStars), [rawInput, totalStars]);
  const pb = usePlayback(frames.length, rawInput, 80);
  const frame = frames[Math.min(pb.step, frames.length - 1)]!;

  return (
    <div className="stack">
      <div className="meta-row">
        <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
          ★ {frame.litStars} / {totalStars} Stars Lit
        </span>
        <span className="badge">{badgeText}</span>
      </div>
      <CanopySvg year={year} totalStars={totalStars} frame={frame} />
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
