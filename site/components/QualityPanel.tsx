import {
  averageCyclomatic,
  computeQualityGrade,
  coveragePercent,
  minCoveragePercent,
  testToCodeRatio,
  type ScopeQuality,
} from '../data/quality';

export interface QualityPanelProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly scope: ScopeQuality;
}

export function QualityPanel({ title, subtitle, scope }: QualityPanelProps) {
  const grade = computeQualityGrade(scope);
  const { coverage, complexity } = scope;
  const minCov = minCoveragePercent(coverage);
  const stmts = coveragePercent(coverage.statements);
  const branches = coveragePercent(coverage.branches);
  const funcs = coveragePercent(coverage.functions);
  const lines = coveragePercent(coverage.lines);

  return (
    <div className="quality-panel">
      <div className="quality-header">
        <div>
          <strong>{title}</strong>
          {subtitle && <span className="muted"> · {subtitle}</span>}
        </div>
        <span className={`badge grade-${grade}`}>Grade {grade}</span>
      </div>
      <div className="metrics-grid">
        <div className="metric-tile">
          <span className="eyebrow">Coverage</span>
          <strong className="nowrap">{minCov}%</strong>
          <div className="metric-sub">
            <span className="nowrap">Lines {lines}%</span>
            <span className="nowrap">Branches {branches}%</span>
            <span className="nowrap">Funcs {funcs}%</span>
            <span className="nowrap">Stmts {stmts}%</span>
          </div>
        </div>
        <div className="metric-tile">
          <span className="eyebrow">Maintainability</span>
          <strong className="nowrap">{complexity.maintainabilityIndex} / 100</strong>
          <div className="metric-sub">
            <span className="nowrap">{complexity.fileCount} source files</span>
          </div>
        </div>
        <div className="metric-tile">
          <span className="eyebrow">Cyclomatic (CC)</span>
          <strong className="nowrap">avg {averageCyclomatic(complexity)}</strong>
          <div className="metric-sub">
            <span className="nowrap">max {complexity.maxCyclomatic}</span>
            <span className="nowrap">{complexity.functionCount} functions</span>
          </div>
        </div>
        <div className="metric-tile">
          <span className="eyebrow">Nesting &amp; Size</span>
          <strong className="nowrap">depth {complexity.maxNestingDepth}</strong>
          <div className="metric-sub">
            <span className="nowrap">{complexity.sloc} SLOC</span>
            <span className="nowrap">{testToCodeRatio(complexity)}x tests</span>
          </div>
        </div>
      </div>
    </div>
  );
}
