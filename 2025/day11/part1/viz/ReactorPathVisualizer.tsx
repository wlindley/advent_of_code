import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, PART1_SOURCE, PART1_TARGET, solver, type ReactorTraceFrame } from '../domain';

function fmtCount(n: bigint): string {
  const s = n.toString();
  return s.length <= 9 ? s : `${s.slice(0, 4)}..${s.slice(-2)}`;
}

export function ReactorPathVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(360);

  const state = useMemo(() => {
    try {
      const graph = solver.parse(rawInput);
      return { ok: true as const, frames: solver.trace!(graph, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => { setFrameIndex(0); setIsPlaying(false); }, [rawInput]);

  const frames: readonly ReactorTraceFrame[] = state.ok ? state.frames : [];
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => {
        if (prev + 1 >= frames.length - 1) { setIsPlaying(false); return frames.length - 1; }
        return prev + 1;
      });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [isPlaying, speedMs, frames.length]);

  if (!state.ok || frames.length === 0) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const clamped = Math.min(frameIndex, frames.length - 1);
  const frame = frames[clamped]!;
  const nodes = frame.relevantNodes;
  const outWays = frame.ways.get(PART1_TARGET) ?? 0n;
  const isDense = nodes.length > 45;
  const maxLayer = nodes.reduce((m, n) => Math.max(m, n.layer), 0);
  const layerCounts = new Array<number>(maxLayer + 1).fill(0);
  for (const n of nodes) layerCounts[n.layer] = (layerCounts[n.layer] ?? 0) + 1;
  const maxPerLayer = Math.max(1, ...layerCounts);

  const W = 920;
  const padX = isDense ? 54 : 74;
  const padY = 30;
  const flowH = isDense ? 72 : 0;
  const graphH = nodes.length === 0 ? 120 : isDense ? Math.min(440, Math.max(240, maxPerLayer * 8)) : Math.max(230, maxPerLayer * 58);
  const H = graphH + flowH + 16;

  const pos = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const cnt = layerCounts[n.layer] ?? 1;
    const x = maxLayer === 0 ? W / 2 : padX + (n.layer / maxLayer) * (W - padX * 2);
    const y = padY + ((n.slot + 0.5) / cnt) * (graphH - padY * 2);
    pos.set(n.id, { x, y });
  }

  const layerBits = new Array<number>(maxLayer + 1).fill(0);
  if (isDense) {
    const totals = new Array<bigint>(maxLayer + 1).fill(0n);
    for (const n of nodes) totals[n.layer] = totals[n.layer]! + (frame.ways.get(n.id) ?? 0n);
    for (let l = 0; l <= maxLayer; l++) layerBits[l] = totals[l] === 0n ? 0 : totals[l]!.toString(2).length;
  }
  const maxBits = Math.max(1, ...layerBits);

  const curve = (u: string, v: string) => {
    const a = pos.get(u)!;
    const b = pos.get(v)!;
    const dx = Math.max(22, (b.x - a.x) * 0.45);
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  };

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Active / Total Devices: <code>{nodes.length} / {frame.totalGraphNodes}</code></span>
        <span className="badge">Step: <code>{frame.stepIndex + 1} / {frame.totalSteps}</code> · Node: <code>{frame.activeNode ?? 'none'}</code></span>
        <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
          <code>{PART1_SOURCE} → {PART1_TARGET}</code> Paths: <strong className="gold"><code>{outWays.toString()}</code></strong>
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Reactor DAG step ${frame.stepIndex + 1} of ${frame.totalSteps}, ${outWays.toString()} paths`}
        style={{ width: '100%', height: 'auto', display: 'block', margin: '0.6rem 0', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}
      >
        {nodes.length === 0 ? (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={14} fill="var(--muted)">
            No directed path exists from {PART1_SOURCE} to {PART1_TARGET}.
          </text>
        ) : (
          <>
            {frame.edges.map(([u, v], i) => (
              <path key={i} d={curve(u, v)} fill="none" stroke="var(--border)" strokeOpacity={isDense ? 0.25 : 0.9} strokeWidth={isDense ? 0.9 : 1.5} />
            ))}
            {frame.activeEdges.map(([u, v], i) => (
              <path key={`a-${i}`} d={curve(u, v)} fill="none" stroke="var(--accent)" strokeOpacity={0.95} strokeWidth={isDense ? 2.2 : 2.8} />
            ))}
            {nodes.map(({ id }) => {
              const { x, y } = pos.get(id)!;
              const w = frame.ways.get(id) ?? 0n;
              const isActive = frame.activeNode === id;
              const isEnd = id === PART1_SOURCE || id === PART1_TARGET;
              const stroke = isActive ? 'var(--accent)' : id === PART1_TARGET && w > 0n ? 'var(--ok)' : isEnd ? 'var(--gold)' : w > 0n ? 'var(--ok)' : 'var(--border)';
              if (isDense) {
                const fill = isActive ? 'var(--accent)' : isEnd ? 'var(--gold)' : w > 0n ? 'var(--ok)' : 'var(--muted)';
                return (
                  <g key={id}>
                    <circle cx={x} cy={y} r={isActive ? 5.5 : isEnd ? 5 : 3} fill={fill} stroke="var(--surface)" strokeWidth={0.8}>
                      <title>{`${id}: ${w.toString()} paths`}</title>
                    </circle>
                    {isEnd && <text x={x} y={y - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">{id}</text>}
                  </g>
                );
              }
              return (
                <g key={id}>
                  <title>{`${id}: ${w.toString()} paths`}</title>
                  <rect x={x - 36} y={y - 17} width={72} height={34} rx={7} fill="var(--surface)" stroke={stroke} strokeWidth={isActive || isEnd ? 2.4 : 1.4} />
                  <text x={x} y={y - 2} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">{id}</text>
                  <text x={x} y={y + 11} textAnchor="middle" fontSize={10} fill={w > 0n ? 'var(--ok)' : 'var(--muted)'}>{fmtCount(w)}</text>
                </g>
              );
            })}
            {isDense && (
              <g>
                <text x={padX} y={graphH + 10} fontSize={10} fontWeight={600} fill="var(--muted)">LAYER FLOW (log2 paths)</text>
                {layerBits.map((bits, l) => {
                  const barW = Math.max(4, (W - padX * 2) / Math.max(1, maxLayer + 1) - 4);
                  const bx = padX + (maxLayer === 0 ? 0 : (l / maxLayer) * (W - padX * 2)) - barW / 2;
                  const bh = bits === 0 ? 2 : 6 + (bits / maxBits) * 40;
                  return <rect key={l} x={bx} y={graphH + 62 - bh} width={barW} height={bh} rx={2} fill={bits > 0 ? 'var(--accent)' : 'var(--border)'}><title>{`Layer ${l}: ~2^${bits}`}</title></rect>;
                })}
              </g>
            )}
          </>
        )}
      </svg>

      <PlaybackControls
        step={clamped}
        totalSteps={frames.length}
        isPlaying={isPlaying}
        speedMs={speedMs}
        onTogglePlay={() => { if (!isPlaying && clamped >= frames.length - 1) setFrameIndex(0); setIsPlaying((p) => !p); }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }}
        onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
