import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { TOTAL_2025_STARS, solver, type FinaleStarNode } from '../domain';

function starPosition(node: FinaleStarNode): { x: number; y: number } {
  if (node.isTopper) return { x: 260, y: 42 };
  const row = Math.floor((node.starNumber - 1) / 4);
  const col = (node.starNumber - 1) % 4;
  const countInRow = row === 5 ? 3 : 4;
  const spread = 60 + row * 34;
  const x = 260 - spread + (col * (2 * spread)) / (countInRow - 1);
  return { x, y: 92 + row * 36 };
}

export function NorthPoleFinaleVisualizer({ rawInput }: VisualizerProps) {
  const frames = useMemo(() => solver.trace!(solver.parse(rawInput)), [rawInput]);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(140);

  useEffect(() => {
    setStep(0);
    setPlaying(true);
  }, [rawInput]);

  useEffect(() => {
    if (!playing || step >= frames.length - 1) return;
    const timer = window.setTimeout(() => setStep((s) => Math.min(frames.length - 1, s + 1)), speedMs);
    return () => window.clearTimeout(timer);
  }, [playing, step, frames.length, speedMs]);

  const frame = frames[Math.min(step, frames.length - 1)]!;

  return (
    <div>
      <div className="meta-row">
        <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
          ★ {frame.litStars} / {TOTAL_2025_STARS} Stars Lit
        </span>
        <span className="badge">2025 Calendar Complete</span>
      </div>
      <svg viewBox="0 0 520 330" style={{ width: '100%', maxWidth: 520, display: 'block', margin: '0.5rem auto' }}>
        <polygon points="260,46 95,286 425,286" fill="rgba(26, 127, 55, 0.14)" stroke="var(--ok)" strokeWidth={2} />
        <rect x={242} y={286} width={36} height={28} rx={4} fill="rgba(154, 103, 0, 0.35)" stroke="var(--gold)" />
        {frame.nodes.map((node) => {
          const { x, y } = starPosition(node);
          const lit = node.starNumber <= frame.litStars;
          return (
            <g key={node.starNumber}>
              <circle
                cx={x}
                cy={y}
                r={node.isTopper ? 15 : 10}
                fill={lit ? (node.isTopper ? '#f59e0b' : 'var(--gold)') : 'var(--bg)'}
                stroke={lit ? 'var(--gold)' : 'var(--border)'}
                strokeWidth={node.isTopper ? 2.5 : 1.5}
              />
              <text x={x} y={y + 4} textAnchor="middle" fontSize={node.isTopper ? 12 : 9} fill={lit ? '#fff' : 'var(--muted)'}>
                {node.isTopper ? '★' : `${node.day}`}
              </text>
              <title>{`Star #${node.starNumber} — Day ${node.day} Part ${node.part}`}</title>
            </g>
          );
        })}
      </svg>
      <PlaybackControls
        step={step}
        totalSteps={frames.length}
        isPlaying={playing}
        speedMs={speedMs}
        onStepChange={setStep}
        onTogglePlay={() => setPlaying((p) => !p)}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
