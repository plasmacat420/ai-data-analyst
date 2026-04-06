const KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET',
  'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'INNER JOIN', 'ON', 'AS', 'AND', 'OR', 'NOT',
  'IN', 'IS', 'NULL', 'LIKE', 'BETWEEN', 'EXISTS', 'DISTINCT', 'COUNT', 'SUM',
  'AVG', 'MAX', 'MIN', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'WITH', 'UNION',
  'DESC', 'ASC', 'BY',
]

function highlightSQL(sql) {
  // Split into tokens preserving whitespace and strings
  const parts = []
  let remaining = sql
  const pattern = new RegExp(
    `('(?:[^'\\\\]|\\\\.)*'|"(?:[^"\\\\]|\\\\.)*"|--[^\\n]*|\\b(${KEYWORDS.join('|')})\\b|\\d+\\.?\\d*|[\\w.]+|[^\\w\\s]+|\\s+)`,
    'gi'
  )

  let match
  while ((match = pattern.exec(sql)) !== null) {
    const token = match[0]
    if (token.startsWith("'") || token.startsWith('"')) {
      parts.push(<span key={match.index} className="text-emerald-400">{token}</span>)
    } else if (KEYWORDS.includes(token.toUpperCase())) {
      parts.push(<span key={match.index} className="text-violet-400 font-semibold">{token.toUpperCase()}</span>)
    } else if (/^\d/.test(token)) {
      parts.push(<span key={match.index} className="text-amber-400">{token}</span>)
    } else if (/^--/.test(token)) {
      parts.push(<span key={match.index} className="text-slate-500 italic">{token}</span>)
    } else {
      parts.push(<span key={match.index} className="text-slate-200">{token}</span>)
    }
  }

  return parts.length > 0 ? parts : [<span key={0} className="text-slate-200">{sql}</span>]
}

export default function SQLDisplay({ sql }) {
  if (!sql) return null

  return (
    <div className="rounded-xl overflow-hidden border border-slate-700">
      <div className="flex items-center justify-between bg-slate-800 px-4 py-2 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <div className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          <span className="text-slate-400 text-xs font-mono">Generated SQL</span>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(sql)}
          className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
        >
          Copy
        </button>
      </div>
      <pre className="bg-slate-950 px-4 py-3 text-sm font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
        {highlightSQL(sql)}
      </pre>
    </div>
  )
}
