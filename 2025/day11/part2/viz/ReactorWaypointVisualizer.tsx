import { useEffect, useMemo, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import {
  bigintLog2, DEFAULT_MAX_TRACE_STEPS, PART2_DAC, PART2_FFT, PART2_SOURCE, PART2_TARGET,
  solver, WaypointCounts, type ReactorWaypointTraceFrame,
} from '../domain';

const STATE_META = [['neither', 'var(--muted)'], ['dac', 'var(--gold)'], ['fft', 'var(--accent)'], ['both', 'var(--ok)']] as const;
const fmtCount = (n: bigint) => { const s = n.toString(); return s.length <= 9 ? s : `${s.slice(0, 4)}..${s.slice(-2)}`; };
const stateTitle = (id: string, c: WaypointCounts) => `${id}: total ${c.total} | neither ${c.neither} | dac ${c.dacOnly} | fft ${c.fftOnly} | both ${c.both}`;
const highestColor = (c: WaypointCounts) =>
  c.both > 0n ? 'var(--ok)' : c.fftOnly > 0n ? 'var(--accent)' : c.dacOnly > 0n ? 'var(--gold)' : c.neither > 0n ? 'var(--muted)' : 'var(--border)';
const share = (part: bigint, total: bigint) => (total === 0n ? 0 : Number((part * 1000n) / total) / 1000);

export function ReactorWaypointVisualizer({ rawInput }: VisualizerProps) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(360);

  const state = useMemo(() => {
    try { return { ok: true as const, frames: solver.trace!(solver.parse(rawInput), { maxSteps: DEFAULT_MAX_TRACE_STEPS }) }; }
    catch (error) { return { ok: false as const, message: error instanceof Error ? error.message : String(error) }; }
  }, [rawInput]);

  useEffect(() => { setFrameIndex(0); setIsPlaying(false); }, [rawInput]);

  const frames: readonly ReactorWaypointTraceFrame[] = state.ok ? state.frames : [];
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => { if (prev + 1 >= frames.length - 1) { setIsPlaying(false); return frames.length - 1; } return prev + 1; });
    }, speedMs);
    return () => window.clearInterval(id);
  }, [isPlaying, speedMs, frames.length]);

  if (!state.ok || frames.length === 0) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  const clamped = Math.min(frameIndex, frames.length - 1);
  const frame = frames[clamped]!;
  const nodes = frame.relevantNodes;
  const outCounts = frame.states.get(PART2_TARGET) ?? WaypointCounts.ZERO;
  const isDense = nodes.length > 45;
  const maxLayer = nodes.reduce((m, n) => Math.max(m, n.layer), 0);
  const layerCounts = new Array<number>(maxLayer + 1).fill(0);
  for (const n of nodes) layerCounts[n.layer] = (layerCounts[n.layer] ?? 0) + 1;
  const maxPerLayer = Math.max(1, ...layerCounts);

  const W = 920, padX = isDense ? 54 : 74, padY = 30, flowH = isDense ? 76 : 0;
  const graphH = nodes.length === 0 ? 120 : isDense ? Math.min(440, Math.max(240, maxPerLayer * 8)) : Math.max(240, maxPerLayer * 62);
  const H = graphH + flowH + 16;

  const pos = new Map<string, { x: number; y: number }>();
  for (const n of nodes) {
    const cnt = layerCounts[n.layer] ?? 1;
    pos.set(n.id, {
      x: maxLayer === 0 ? W / 2 : padX + (n.layer / maxLayer) * (W - padX * 2),
      y: padY + ((n.slot + 0.5) / cnt) * (graphH - padY * 2),
    });
  }

  const layerSums: [bigint, bigint, bigint, bigint][] = Array.from({ length: maxLayer + 1 }, () => [0n, 0n, 0n, 0n]);
  const layerLogs = new Array<number>(maxLayer + 1).fill(0);
  if (isDense) {
    for (const n of nodes) {
      const c = frame.states.get(n.id) ?? WaypointCounts.ZERO, s = layerSums[n.layer]!;
      s[0] += c.neither; s[1] += c.dacOnly; s[2] += c.fftOnly; s[3] += c.both;
    }
    for (let l = 0; l <= maxLayer; l++) {
      const s = layerSums[l]!, sum = s[0] + s[1] + s[2] + s[3];
      layerLogs[l] = sum > 0n ? bigintLog2(sum) : 0;
    }
  }
  const maxLog = Math.max(1, ...layerLogs);
  const curve = (u: string, v: string) => {
    const a = pos.get(u)!, b = pos.get(v)!, dx = Math.max(22, (b.x - a.x) * 0.45);
    return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
  };

  return (
    <div>
      <div className="meta-row">
        <span className="badge">Active / Total Devices: <code>{nodes.length} / {frame.totalGraphNodes}</code></span>
        <span className="badge">Step: <code>{frame.stepIndex + 1} / {frame.totalSteps}</code> · Node: <code>{frame.activeNode ?? 'none'}</code></span>
        <span className={`badge ${frame.isComplete ? 'status-solved' : ''}`}>
          <code>{PART2_SOURCE} → {PART2_TARGET}</code> ({PART2_DAC} &amp; {PART2_FFT}): <strong className="gold"><code>{outCounts.both.toString()}</code></strong>
        </span>
        <span className="badge">Total <code>{PART2_SOURCE} → {PART2_TARGET}</code>: <code>{outCounts.total.toString()}</code></span>
        {STATE_META.map(([label, color]) => (
          <span key={label} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: 'inline-block' }} />{label}
          </span>
        ))}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Reactor waypoint DAG step ${frame.stepIndex + 1} of ${frame.totalSteps}, ${outCounts.both.toString()} valid paths`} style={{ width: '100%', height: 'auto', display: 'block', margin: '0.6rem 0', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
        {nodes.length === 0 ? (
          <text x={W / 2} y={H / 2} textAnchor="middle" fontSize={14} fill="var(--muted)">No directed path exists from {PART2_SOURCE} to {PART2_TARGET}.</text>
        ) : (
          <>
            {frame.edges.map(([u, v], i) => <path key={i} d={curve(u, v)} fill="none" stroke="var(--border)" strokeOpacity={isDense ? 0.25 : 0.9} strokeWidth={isDense ? 0.9 : 1.5} />)}
            {frame.activeEdges.map(([u, v], i) => <path key={`a-${i}`} d={curve(u, v)} fill="none" stroke="var(--accent)" strokeOpacity={0.95} strokeWidth={isDense ? 2.2 : 2.8} />)}
            {nodes.map(({ id }) => {
              const { x, y } = pos.get(id)!, c = frame.states.get(id) ?? WaypointCounts.ZERO;
              const isActive = frame.activeNode === id, isPinned = id === PART2_SOURCE || id === PART2_TARGET || id === PART2_DAC || id === PART2_FFT, topColor = highestColor(c);
              if (isDense) {
                return (
                  <g key={id}>
                    <circle cx={x} cy={y} r={isActive ? 5.5 : isPinned ? 5 : 3} fill={topColor} stroke={isActive ? 'var(--text)' : 'var(--surface)'} strokeWidth={isActive ? 1.6 : 0.8}><title>{stateTitle(id, c)}</title></circle>
                    {isPinned && <text x={x} y={y - 8} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)" stroke="var(--surface)" strokeWidth={3} paintOrder="stroke">{id}</text>}
                  </g>
                );
              }
              let bx = x - 32;
              return (
                <g key={id}>
                  <title>{stateTitle(id, c)}</title>
                  <rect x={x - 38} y={y - 19} width={76} height={38} rx={7} fill="var(--surface)" stroke={isActive ? 'var(--accent)' : isPinned ? 'var(--gold)' : topColor} strokeWidth={isActive || isPinned ? 2.3 : 1.4} />
                  <text x={x} y={y - 4} textAnchor="middle" fontSize={11} fontWeight={700} fill="var(--text)">{id}</text>
                  <text x={x} y={y + 8} textAnchor="middle" fontSize={10} fill={c.both > 0n ? 'var(--ok)' : 'var(--muted)'}>{fmtCount(c.total)}</text>
                  <rect x={x - 32} y={y + 12} width={64} height={4} rx={2} fill="var(--border)" />
                  {c.total > 0n && [c.neither, c.dacOnly, c.fftOnly, c.both].map((p, idx) => {
                    const segW = share(p, c.total) * 64, rx = bx; bx += segW;
                    return segW > 0 ? <rect key={idx} x={rx} y={y + 12} width={segW} height={4} fill={STATE_META[idx]![1]} /> : null;
                  })}
                </g>
              );
            })}
            {isDense && (
              <g>
                <text x={padX} y={graphH + 10} fontSize={10} fontWeight={600} fill="var(--muted)">LAYER FLOW (log2 paths, 4-state share)</text>
                {layerSums.map((s, l) => {
                  const total = s[0] + s[1] + s[2] + s[3], barW = Math.max(4, (W - padX * 2) / Math.max(1, maxLayer + 1) - 4);
                  const bx = padX + (maxLayer === 0 ? 0 : (l / maxLayer) * (W - padX * 2)) - barW / 2;
                  const bh = total === 0n ? 2 : 6 + (layerLogs[l]! / maxLog) * 44;
                  let curY = graphH + 66;
                  return (
                    <g key={l}>
                      <title>{`Layer ${l}: total ${total} (neither ${s[0]}, dac ${s[1]}, fft ${s[2]}, both ${s[3]})`}</title>
                      {total === 0n ? <rect x={bx} y={curY - 2} width={barW} height={2} rx={1} fill="var(--border)" /> : s.map((p, idx) => {
                        const segH = share(p, total) * bh; curY -= segH;
                        return segH > 0 ? <rect key={idx} x={bx} y={curY} width={barW} height={segH} fill={STATE_META[idx]![1]} /> : null;
                      })}
                    </g>
                  );
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
