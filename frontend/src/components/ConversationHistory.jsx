import ResultsPanel from './ResultsPanel'

export default function ConversationHistory({ history, onToggle, onClear }) {
  if (!history.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8 py-16">
        <p className="text-5xl mb-4">🤖</p>
        <p className="text-slate-400 text-base font-medium">Your AI Data Analyst is ready</p>
        <p className="text-slate-600 text-sm mt-2">
          Load a dataset and ask a question to see results here
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
          Conversation
        </p>
        <button
          onClick={onClear}
          className="text-slate-600 hover:text-red-400 text-xs transition-colors"
        >
          Clear history
        </button>
      </div>

      {history.map((item) => (
        <div key={item.id} className="space-y-3">
          {/* User question — right aligned */}
          <div className="flex justify-end">
            <div
              className="bg-violet-600/20 border border-violet-600/30 rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] cursor-pointer hover:bg-violet-600/30 transition-colors"
              onClick={() => onToggle(item.id)}
            >
              <p className="text-violet-100 text-sm">{item.question}</p>
            </div>
          </div>

          {/* Result summary — left aligned */}
          <div className="flex items-start gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-700 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
              🤖
            </div>
            <div className="flex-1 min-w-0">
              {/* Collapsed summary */}
              {!item.expanded && (
                <button
                  onClick={() => onToggle(item.id)}
                  className="text-left bg-slate-800 border border-slate-700 hover:border-slate-600 rounded-xl px-4 py-2.5 transition-colors w-full"
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-300 text-sm">
                      {item.row_count?.toLocaleString() ?? 0} rows returned
                    </span>
                    {item.chart?.type && item.chart.type !== 'none' && (
                      <span className="bg-violet-800/40 text-violet-300 text-xs px-2 py-0.5 rounded-full">
                        {item.chart.type} chart
                      </span>
                    )}
                    {item.error && (
                      <span className="bg-red-900/40 text-red-300 text-xs px-2 py-0.5 rounded-full">
                        error
                      </span>
                    )}
                    <span className="text-slate-600 text-xs">{item.execution_time_ms}ms</span>
                    <span className="text-slate-500 text-xs ml-auto">Click to expand</span>
                  </div>
                </button>
              )}

              {/* Expanded full result */}
              {item.expanded && (
                <div className="space-y-3">
                  <ResultsPanel result={item} />
                  <button
                    onClick={() => onToggle(item.id)}
                    className="text-slate-600 hover:text-slate-400 text-xs transition-colors"
                  >
                    Collapse
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
