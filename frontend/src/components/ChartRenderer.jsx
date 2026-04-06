import {
  ResponsiveContainer,
  BarChart, Bar,
  LineChart, Line,
  AreaChart, Area,
  PieChart, Pie, Cell,
  ScatterChart, Scatter,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts'

const PALETTE = ['#7c3aed', '#a78bfa', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6']

function formatValue(val) {
  if (typeof val === 'number') {
    return val >= 1000 ? val.toLocaleString(undefined, { maximumFractionDigits: 1 }) : val
  }
  return val
}

function prepareData(chart, columns, rows) {
  if (!columns.length || !rows.length) return []
  const xIdx = chart.x_column ? columns.indexOf(chart.x_column) : 0
  const yIdx = chart.y_column ? columns.indexOf(chart.y_column) : 1
  return rows.map((row) => ({
    x: row[xIdx] ?? '',
    y: typeof row[yIdx] === 'number' ? row[yIdx] : parseFloat(row[yIdx]) || 0,
    name: String(row[xIdx] ?? ''),
    value: typeof row[yIdx] === 'number' ? row[yIdx] : parseFloat(row[yIdx]) || 0,
  }))
}

const CHART_HEIGHT = 300
const AXIS_STYLE = { fill: '#94a3b8', fontSize: 11 }
const GRID_STYLE = { stroke: '#1e293b' }

export default function ChartRenderer({ chart, columns, rows }) {
  if (!chart || chart.type === 'none' || !rows?.length) return null

  const data = prepareData(chart, columns, rows)

  const xLabel = chart.x_column || columns[0] || 'x'
  const yLabel = chart.y_column || columns[1] || 'value'

  const commonProps = {
    data,
    margin: { top: 10, right: 20, left: 10, bottom: 40 },
  }

  const renderTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs shadow-xl">
        {label !== undefined && <p className="text-slate-400 mb-1">{label}</p>}
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color || '#a78bfa' }} className="font-medium">
            {p.name}: {formatValue(p.value)}
          </p>
        ))}
      </div>
    )
  }

  if (chart.type === 'bar') {
    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <BarChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} />
          <XAxis dataKey="x" tick={AXIS_STYLE} angle={-35} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tick={AXIS_STYLE} tickFormatter={formatValue} />
          <Tooltip content={renderTooltip} />
          <Bar dataKey="y" name={yLabel} fill="#7c3aed" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  }

  if (chart.type === 'line') {
    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} />
          <XAxis dataKey="x" tick={AXIS_STYLE} angle={-35} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tick={AXIS_STYLE} tickFormatter={formatValue} />
          <Tooltip content={renderTooltip} />
          <Line type="monotone" dataKey="y" name={yLabel} stroke="#7c3aed" strokeWidth={2} dot={data.length <= 30} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    )
  }

  if (chart.type === 'area') {
    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} />
          <XAxis dataKey="x" tick={AXIS_STYLE} angle={-35} textAnchor="end" interval="preserveStartEnd" />
          <YAxis tick={AXIS_STYLE} tickFormatter={formatValue} />
          <Tooltip content={renderTooltip} />
          <Area type="monotone" dataKey="y" name={yLabel} stroke="#7c3aed" strokeWidth={2} fill="url(#areaGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    )
  }

  if (chart.type === 'pie') {
    // Collapse to max 8 slices
    let pieData = [...data]
    if (pieData.length > 8) {
      const top7 = pieData.slice(0, 7)
      const otherVal = pieData.slice(7).reduce((acc, d) => acc + d.value, 0)
      pieData = [...top7, { name: 'Other', value: otherVal }]
    }

    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            outerRadius={110}
            dataKey="value"
            nameKey="name"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
            labelLine={false}
          >
            {pieData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
          </Pie>
          <Tooltip content={renderTooltip} />
          <Legend formatter={(v) => <span className="text-slate-300 text-xs">{v}</span>} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  if (chart.type === 'scatter') {
    return (
      <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
        <ScatterChart margin={{ top: 10, right: 20, left: 10, bottom: 40 }}>
          <CartesianGrid strokeDasharray="3 3" {...GRID_STYLE} />
          <XAxis dataKey="x" name={xLabel} tick={AXIS_STYLE} tickFormatter={formatValue} />
          <YAxis dataKey="y" name={yLabel} tick={AXIS_STYLE} tickFormatter={formatValue} />
          <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3' }} />
          <Scatter data={data} fill="#7c3aed" />
        </ScatterChart>
      </ResponsiveContainer>
    )
  }

  return null
}
