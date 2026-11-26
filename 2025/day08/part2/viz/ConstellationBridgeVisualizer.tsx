import { useEffect, useMemo, useRef, useState } from 'react';
import { PlaybackControls, type VisualizerProps } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, connectUntilSingleCircuit, solver, traceFinalBridge, type BridgeTraceFrame } from '../domain';

const LEGEND: ReadonlyArray<readonly [string, string]> = [
  ['Side A Circuit', '#06b6d4'], ['Side B Circuit', '#f59e0b'],
  ['Final Bridge', '#eab308'], ['Active / Endpoint', '#10b981'],
];

export function ConstellationBridgeVisualizer({ rawInput }: VisualizerProps) {
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
      const result = connectUntilSingleCircuit(pts);
      const frames = traceFinalBridge(pts, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
      let loX = Infinity, hiX = -Infinity, loY = Infinity, hiY = -Infinity, loZ = Infinity, hiZ = -Infinity;
      for (const p of pts) {
        if (p.x < loX) loX = p.x; if (p.x > hiX) hiX = p.x;
        if (p.y < loY) loY = p.y; if (p.y > hiY) hiY = p.y;
        if (p.z < loZ) loZ = p.z; if (p.z > hiZ) hiZ = p.z;
      }
      const cx = (loX + hiX) / 2, cy = (loY + hiY) / 2, cz = (loZ + hiZ) / 2;
      const span = Math.max(hiX - loX, hiY - loY, hiZ - loZ, 1) / 2;
      return {
        ok: true as const, pts, n, result, frames,
        nx: Float64Array.from(pts, (p) => (p.x - cx) / span),
        ny: Float64Array.from(pts, (p) => (p.y - cy) / span),
        nz: Float64Array.from(pts, (p) => (p.z - cz) / span),
      };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [rawInput]);

  useEffect(() => { setFrameIndex(0); setIsPlaying(false); }, [rawInput]);
  const frames: readonly BridgeTraceFrame[] = state.ok ? state.frames : [];
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
    const { n, nx, ny, nz, result } = state, { mstEdges, sideOf, finalEdge } = result, w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const cosY = Math.cos(yaw), sinY = Math.sin(yaw), cosP = Math.cos(pitch), sinP = Math.sin(pitch);
    const sx = new Float64Array(n), sy = new Float64Array(n), depth = new Float64Array(n), order = new Uint32Array(n);
    for (let i = 0; i < n; i += 1) {
      const x1 = nx[i]! * cosY + nz[i]! * sinY, z1 = -nx[i]! * sinY + nz[i]! * cosY;
      const y2 = ny[i]! * cosP - z1 * sinP, z2 = ny[i]! * sinP + z1 * cosP, scale = 280 / (3.3 - z2);
      sx[i] = w / 2 + x1 * scale; sy[i] = h / 2 - y2 * scale; depth[i] = z2; order[i] = i;
    }
    const preLimit = Math.min(frame.edgeCount, mstEdges.length - 1);
    ctx.lineWidth = n > 200 ? 1.0 : 1.5;
    for (const [side, color] of [[0, 'rgba(6, 182, 212, 0.45)'], [1, 'rgba(245, 158, 11, 0.45)']] as const) {
      ctx.strokeStyle = color; ctx.beginPath();
      for (let k = 0; k < preLimit; k += 1) {
        const e = mstEdges[k]!;
        if (sideOf[e.u] === side && sideOf[e.v] === side) { ctx.moveTo(sx[e.u]!, sy[e.u]!); ctx.lineTo(sx[e.v]!, sy[e.v]!); }
      }
      ctx.stroke();
    }
    if (frame.isFinalBridge) {
      const { u, v } = finalEdge;
      ctx.save();
      ctx.shadowColor = '#f59e0b'; ctx.shadowBlur = 14; ctx.lineWidth = 4.5; ctx.strokeStyle = '#eab308';
      ctx.beginPath(); ctx.moveTo(sx[u]!, sy[u]!); ctx.lineTo(sx[v]!, sy[v]!); ctx.stroke();
      ctx.shadowBlur = 0; ctx.lineWidth = 1.8; ctx.strokeStyle = '#10b981';
      ctx.beginPath(); ctx.moveTo(sx[u]!, sy[u]!); ctx.lineTo(sx[v]!, sy[v]!); ctx.stroke();
      for (const end of [u, v]) {
        ctx.beginPath(); ctx.arc(sx[end]!, sy[end]!, 10, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.75)'; ctx.lineWidth = 2.2; ctx.stroke();
      }
      ctx.restore();
    } else if (frame.lastEdge) {
      ctx.save(); ctx.lineWidth = 2.4; ctx.strokeStyle = '#10b981';
      ctx.beginPath(); ctx.moveTo(sx[frame.lastEdge.u]!, sy[frame.lastEdge.u]!); ctx.lineTo(sx[frame.lastEdge.v]!, sy[frame.lastEdge.v]!); ctx.stroke(); ctx.restore();
    }
    order.sort((a, b) => depth[a]! - depth[b]!);
    const baseR = n > 200 ? 2.4 : 4.5;
    for (let idx = 0; idx < n; idx += 1) {
      const i = order[idx]!, isBridgeEnd = frame.isFinalBridge && (i === finalEdge.u || i === finalEdge.v);
      const isActive = frame.lastEdge !== null && (frame.lastEdge.u === i || frame.lastEdge.v === i);
      const r = baseR * (0.75 + 0.3 * ((depth[i]! + 1.5) / 3)) + (isBridgeEnd ? 2.5 : isActive ? 1.5 : 0);
      ctx.beginPath(); ctx.arc(sx[i]!, sy[i]!, r, 0, Math.PI * 2);
      ctx.fillStyle = isBridgeEnd ? '#eab308' : sideOf[i] === 0 ? '#06b6d4' : '#f59e0b'; ctx.fill();
      if (isBridgeEnd || isActive) { ctx.strokeStyle = isBridgeEnd ? '#1e293b' : '#10b981'; ctx.lineWidth = 1.6; ctx.stroke(); }
    }
  }, [state, frame, yaw, pitch]);

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }
  const { pts, result } = state;
  const xProdLabel = frame.lastEdge ? `${pts[frame.lastEdge.u]!.x} × ${pts[frame.lastEdge.v]!.x} = ${frame.edgeXProduct!.toString()}` : '—';
  return (
    <div>
      <div className="meta-row">
        <span className="badge">MST Edges: <code>{frame.edgeCount} / {frame.totalEdges}</code></span>
        <span className="badge">Components: <code>{frame.componentCount}</code></span>
        <span className={frame.isFinalBridge ? 'badge status-solved' : 'badge'}>
          {frame.isFinalBridge ? 'Bridge' : 'Last Edge'} x·x: <strong className={frame.isFinalBridge ? 'gold' : undefined}><code>{xProdLabel}</code></strong>
        </span>
        <span className="badge status-solved">Answer: <strong className="gold"><code>{result.answer.toString()}</code></strong></span>
        <button type="button" onClick={() => { setIsPlaying(false); setFrameIndex(frames.length - 1); }} disabled={clampedIndex >= frames.length - 1}>
          Jump to Final Bridge
        </button>
        <button type="button" onClick={() => setAutoOrbit((v) => !v)}>Auto-orbit: {autoOrbit ? 'On' : 'Off'}</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start', margin: '0.6rem 0' }}>
        <canvas
          ref={canvasRef} width={540} height={380} aria-label={`3D MST bridge projection of ${state.n} junction boxes`}
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
