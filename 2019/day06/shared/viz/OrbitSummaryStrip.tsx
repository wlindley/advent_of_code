import type { OrbitMap } from '../orbitMap';
import type { OrbitQueryPolicy, OrbitTraceFrame } from '../policy';

export interface OrbitSummaryStripProps {
  readonly map: OrbitMap;
  readonly policy: OrbitQueryPolicy;
  readonly answer: number;
  readonly frame: OrbitTraceFrame;
  readonly sampledCount: number;
  readonly layoutShown: boolean;
}

/** Telemetry strip and scale caption for orbit depth sweeps and transfer routes. */
export function OrbitSummaryStrip({
  map,
  policy,
  answer,
  frame,
  sampledCount,
  layoutShown,
}: OrbitSummaryStripProps) {
  return (
    <div className="stack" style={{ gap: '0.45rem' }}>
      <div className="meta-row" style={{ margin: 0 }}>
        <span className="badge">Nodes: {map.nodeCount}</span>
        <span className="badge">Max depth: {map.maxDepth}</span>
        <span className="badge status-solved">
          {policy.name}: {answer}
        </span>
        {frame.kind === 'depth-sweep' ? (
          <>
            <span className="badge">
              Shell d={frame.activeDepth} / {map.maxDepth}
            </span>
            <span className="badge">Shell nodes: {frame.shellNodeCount}</span>
            <span className="badge">Cumulative orbits: {frame.cumulativeOrbits}</span>
          </>
        ) : (
          <>
            <span className="badge">
              Route step {frame.stepIndex + 1} / {frame.totalSteps}
            </span>
            <span className="badge">
              LCA: {map.labelOf(frame.lcaNodeId)} (d={map.depthOfId(frame.lcaNodeId)})
            </span>
            <span className="badge">
              Transfers: {frame.traversedNodeIds.length - 1} / {frame.totalSteps - 1}
            </span>
          </>
        )}
      </div>
      <p className="muted chart-caption" style={{ margin: 0 }}>
        {layoutShown
          ? 'Layered COM tree (left to right by orbital depth) paired with the depth-shell distribution.'
          : `Tree topology omitted above 64 nodes (${map.nodeCount} objects); showing binned depth-shell telemetry (${sampledCount} trace frames).`}
      </p>
      {frame.kind === 'transfer' && !layoutShown && (
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="badge">
            Start {map.labelOf(frame.fromNodeId)} (d={map.depthOfId(frame.fromNodeId)})
          </span>
          <span className="badge gold">
            LCA {map.labelOf(frame.lcaNodeId)} (d={map.depthOfId(frame.lcaNodeId)})
          </span>
          <span className="badge">
            Target {map.labelOf(frame.toNodeId)} (d={map.depthOfId(frame.toNodeId)})
          </span>
        </div>
      )}
    </div>
  );
}
