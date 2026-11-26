import { useEffect, useMemo, useRef, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, PART1_PAIR_COUNT, connectClosestCircuits, solver, traceCircuitConnections, type CircuitTraceFrame } from '../domain';

const TIER_COLORS = ['#cbd5e1', '#64748b', '#f59e0b', '#06b6d4', '#6366f1'] as const;
const LEGEND: ReadonlyArray<readonly [string, string]> = [
  ['#1 Circuit', '#6366f1'], ['#2 Circuit', '#06b6d4'], ['#3 Circuit', '#f59e0b'],
  ['Other Circuit', '#64748b'], ['Singleton', '#cbd5e1'], ['Active Merge', '#10b981'], ['Active Redundant', '#ef4444'],
];

export function CircuitOrbitVisualizer({ rawInput, pairCount = PART1_PAIR_COUNT }: VisualizerProps & { readonly pairCount?: number }) {
  const [frameIndex, setFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(120);
  const [yaw, setYaw] = useState(0.55);
  const [pitch, setPitch] = useState(0.32);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragRef = useRef<{ id: number; x: number; y: number } | null>(null);

  const state = useMemo(() => {
    try {
      const pts = solver.parse(rawInput), n = pts.length;
      const { steps } = connectClosestCircuits(pts, pairCount);
      const frames = traceCircuitConnections(pts, pairCount, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      let loX = Infinity, hiX = -Infinity, loY = Infinity, hiY = -Infinity, loZ = Infinity, hiZ = -Infinity;
      for (const p of pts) {
        if (p.x < loX) loX = p.x; if (p.x > hiX) hiX = p.x;
        if (p.y < loY) loY = p.y; if (p.y > hiY) hiY = p.y;
        if (p.z < loZ) loZ = p.z; if (p.z > hiZ) hiZ = p.z;
      }
      const cx = (loX + hiX) / 2, cy = (loY + hiY) / 2, cz = (loZ + hiZ) / 2;
      const span = Math.max(hiX - loX, hiY - loY, hiZ - loZ, 1) / 2;
      const nx = Float64Array.from(pts, (p) => (p.x - cx) / span);
      const ny = Float64Array.from(pts, (p) => (p.y - cy) / span);
      const nz = Float64Array.from(pts, (p) => (p.z - cz) / span);
      return { ok: true as const, n, nx, ny, nz, steps, frames };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput, pairCount]);

  useEffect(() => { setFrameIndex(0); setIsPlaying(false); }, [rawInput, pairCount]);
  const frames: readonly CircuitTraceFrame[] = state.ok ? state.frames : [];
  useEffect(() => {
    if (!isPlaying || frames.length <= 1) return;
    const id = window.setInterval(() => setFrameIndex((p) => (p + 1 >= frames.length - 1 ? (setIsPlaying(false), frames.length - 1) : p + 1)), speedMs);
    return () => window.clearInterval(id);
  }, [isPlaying, speedMs, frames.length]);
  useEffect(() => {
    if (!autoOrbit) return;
    let raf = 0, last = performance.now();
    const tick = (now: number) => { if (!dragRef.current) setYaw((y) => y + (now - last) * 0.00045); last = now; raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [autoOrbit]);

  const clampedIndex = Math.min(frameIndex, Math.max(0, frames.length - 1));
  const frame = frames[clampedIndex];

  useEffect(() => {
    const canvas = canvasRef.current, ctx = canvas?.getContext('2d');
    if (!state.ok || !frame || !canvas || !ctx) return;
    const { n, nx, ny, nz, steps } = state, w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw), cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    const sx = new Float64Array(n), sy = new Float64Array(n), depth = new Float64Array(n), order = new Uint32Array(n);
    for (let i = 0; i < n; i += 1) {
      const x1 = nx[i]! * cosY + nz[i]! * sinY, z1 = -nx[i]! * sinY + nz[i]! * cosY;
      const y2 = ny[i]! * cosP - z1 * sinP, z2 = ny[i]! * sinP + z1 * cosP, scale = 280 / (3.3 - z2);
      sx[i] = w / 2 + x1 * scale; sy[i] = h / 2 - y2 * scale; depth[i] = z2; order[i] = i;
    }
    ctx.lineWidth = n > 200 ? 0.9 : 1.4; ctx.strokeStyle = 'rgba(100, 116, 139, 0.32)'; ctx.beginPath();
    for (let k = 0; k < frame.stepIndex; k += 1) {
      const s = steps[k]!;
      if (s.merged) { ctx.moveTo(sx[s.pair.u]!, sy[s.pair.u]!); ctx.lineTo(sx[s.pair.v]!, sy[s.pair.v]!); }
    }
    ctx.stroke();
    if (frame.lastPair) {
      const { u, v } = frame.lastPair;
      ctx.save(); ctx.lineWidth = 2.6; ctx.strokeStyle = frame.lastMerged ? '#10b981' : '#ef4444';
      if (!frame.lastMerged) ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(sx[u]!, sy[u]!); ctx.lineTo(sx[v]!, sy[v]!); ctx.stroke(); ctx.restore();
    }
    order.sort((a, b) => depth[a]! - depth[b]!);
    const baseR = n > 200 ? 2.4 : 4.5;
    for (let idx = 0; idx < n; idx += 1) {
      const i = order[idx]!, tier = frame.pointTiers[i]!;
      const active = frame.lastPair !== null && (frame.lastPair.u === i || frame.lastPair.v === i);
      const r = baseR * (0.75 + 0.3 * ((depth[i]! + 1.5) / 3)) + (active ? 2 : 0);
      ctx.beginPath(); ctx.arc(sx[i]!, sy[i]!, r, 0, Math.PI * 2); ctx.fillStyle = TIER_COLORS[tier]!; ctx.fill();
      if (active || tier >= 2) { ctx.strokeStyle = active ? (frame.lastMerged ? '#10b981' : '#ef4444') : '#1e293b'; ctx.lineWidth = active ? 1.8 : 0.7; ctx.stroke(); }
    }
  }, [state, frame, yaw, pitch]);

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  return (
    <div>
      <div className="meta-row">
        <span className="badge">Pairs: <code>{frame.stepIndex} / {frame.totalSteps}</code></span>
        <span className="badge">Merged / Redundant: <code>{frame.mergedCount} / {frame.redundantCount}</code></span>
        <span className="badge">Circuits: <code>{frame.componentCount}</code></span>
        <span className="badge status-solved">Top 3: <strong className="gold"><code>{frame.topThreeSizes.join(' × ')} = {frame.product}</code></strong></span>
        <button type="button" onClick={() => setAutoOrbit((v) => !v)}>Auto-orbit: {autoOrbit ? 'On' : 'Off'}</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', margin: '0.6rem 0' }}>
        <canvas
          ref={canvasRef} width={540} height={380} aria-label={`3D circuit projection of ${state.n} junction boxes`}
          onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY }; }}
          onPointerMove={(e) => {
            if (!dragRef.current || dragRef.current.id !== e.pointerId) return;
            const dx = e.clientX - dragRef.current.x, dy = e.clientY - dragRef.current.y;
            dragRef.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
            setYaw((v) => v + dx * 0.01); setPitch((v) => Math.max(-1.4, Math.min(1.4, v + dy * 0.01)));
          }}
          onPointerUp={() => { dragRef.current = null; }} onPointerCancel={() => { dragRef.current = null; }}
          style={{ width: '100%', maxWidth: 540, height: 'auto', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--surface)', cursor: 'grab', touchAction: 'none' }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', padding: '0.6rem 0.75rem', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', fontSize: '0.8rem' }}>
          {LEGEND.map(([label, color]) => (
            <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: color, border: '1px solid var(--border)', flexShrink: 0 }} />{label}
            </span>
          ))}
        </div>
      </div>
      <PlaybackControls
        step={clampedIndex} totalSteps={frames.length} isPlaying={isPlaying} speedMs={speedMs}
        onTogglePlay={() => { if (!isPlaying && clampedIndex >= frames.length - 1) setFrameIndex(0); setIsPlaying((p) => !p); }}
        onStepChange={(next) => { setIsPlaying(false); setFrameIndex(next); }} onSpeedChange={setSpeedMs}
      />
    </div>
  );
}
