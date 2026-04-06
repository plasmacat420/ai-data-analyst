import { useState } from 'react'
import SQLDisplay from './SQLDisplay'
import ChartRenderer from './ChartRenderer'

const PAGE_SIZE = 20

export default function ResultsPanel({ result }) {
  const [showAll, setShowAll] = useState(false)

  if (!result) return null

  const { sql, explanation, columns, rows, row_count, chart, execution_time_ms, error } = result
  const displayRows = showAll ? rows : rows.slice(0, PAGE_SIZE)

  if (error) {
    return (
      <div className="bg-red-900/20 border border-red-700/40 rounded-xl p-4 text-sm text-red-300">
        <span className="font-semibold">Error: </span>{error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* SQL */}
      <SQLDisplay sql={sql} />

      {/* Explanation */}
      {explanation && (
        <div className="flex gap-3 text-sm text-slate-300 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
          <span className="text-violet-400 flex-shrink-0">💡</span>
          <p className="leading-relaxed">{explanation}</p>
        </div>
      )}

      {/* Chart */}
      {chart && chart.type !== 'none' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          {chart.title && (
            <p className="text-slate-300 text-sm font-medium mb-3">{chart.title}</p>
          )}
          <ChartRenderer chart={chart} columns={columns} rows={rows} />
        </div>
      )}

      {/* Table */}
      {columns.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-slate-800/50">
            <div className="flex items-center gap-3">
              <span className="text-slate-300 text-sm font-medium">Results</span>
              <span className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded-full">
                {row_count.toLocaleString()} rows
              </span>
              {chart?.type && chart.type !== 'none' && (
                <span className="bg-violet-800/40 text-violet-300 text-xs px-2 py-0.5 rounded-full">
                  {chart.type} chart
                </span>
              )}
            </div>
            <span className="text-slate-500 text-xs">{execution_time_ms}ms</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  {columns.map((col) => (
                    <th
                      key={col}
                      className="text-left text-slate-400 font-medium px-4 py-2.5 whitespace-nowrap text-xs uppercase tracking-wider"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, ri) => (
                  <tr key={ri} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-4 py-2.5 text-slate-300 whitespace-nowrap font-mono text-xs">
                        {cell === null ? <span className="text-slate-600">null</span> : String(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length > PAGE_SIZE && (
            <div className="px-4 py-3 border-t border-slate-800 text-center">
              <button
                onClick={() => setShowAll((v) => !v)}
                className="text-violet-400 hover:text-violet-300 text-xs transition-colors"
              >
                {showAll ? 'Show fewer rows' : `Show all ${row_count.toLocaleString()} rows`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
