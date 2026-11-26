export function MetricsGuide() {
  return (
    <details className="metrics-guide">
      <summary>How Code Quality Metrics Are Computed</summary>
      <div className="guide-grid">
        <div>
          <strong>Coverage (V8):</strong> Live Vitest statement, branch, function, and line coverage across all non-UI
          modules (<code>shared/core</code>, <code>tools</code>, <code>site/data</code>, and puzzle <code>domain/</code>).
        </div>
        <div>
          <strong>Maintainability Index (0–100):</strong> Per-function SEI Maintainability Index combining Halstead
          volume, cyclomatic complexity, and SLOC. ≥80 = High (Grade A), 65–79 = Moderate (B).
        </div>
        <div>
          <strong>Cyclomatic Complexity (CC):</strong> McCabe independent branch paths per function (base 1 +{' '}
          <code>if</code>/<code>for</code>/<code>while</code>/<code>&amp;&amp;</code>/<code>||</code>/<code>?:</code>).
          Clicking the Cyclomatic tile opens the highest-CC function directly on GitHub.
        </div>
        <div>
          <strong>Nesting &amp; Function Size:</strong> Deepest control-flow nesting depth and longest function SLOC
          (target &lt; 30 LoC, avoiding nested functions). Clicking opens the longest function on GitHub.
        </div>
        <div>
          <strong>Test-to-Code Ratio:</strong> Test SLOC divided by production SLOC across unit and differential oracle
          suites.
        </div>
        <div>
          <strong>Quality Grade (A–D):</strong> Grade A requires ≥95% minimum coverage, Maintainability Index ≥80, and
          average Cyclomatic Complexity ≤5.
        </div>
      </div>
    </details>
  );
}
