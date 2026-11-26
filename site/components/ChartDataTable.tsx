import type { ChartSeries, TimePoint } from '../data/metricsSeries';

export interface ChartDataTableProps {
  readonly title: string;
  readonly points: readonly TimePoint[];
  readonly series: readonly ChartSeries[];
  readonly formatValue: (value: number) => string;
}

export function ChartDataTable({ title, points, series, formatValue }: ChartDataTableProps) {
  return (
    <details className="chart-table-details">
      <summary>Data table ({points.length} rows)</summary>
      <div className="table-scroll chart-table-wrap">
        <table className="quality-table">
          <caption>{title} measurements</caption>
          <thead>
            <tr>
              <th scope="col">Point</th>
              {series.map((s) => (
                <th key={s.id} scope="col">{s.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {points.map((pt, idx) => (
              <tr key={`${pt.timestampMs}-${idx}`}>
                <td className="nowrap">{pt.label}</td>
                {series.map((s) => (
                  <td key={s.id} className="nowrap">
                    {s.points[idx] !== undefined ? formatValue(s.points[idx]!.value) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}
