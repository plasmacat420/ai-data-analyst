import { useRef, useState } from 'react'

const SAMPLES = [
  { name: 'sales', label: 'Sales Data', desc: '500 rows · revenue, products, regions', icon: '📈' },
  { name: 'employees', label: 'Employee Data', desc: '100 rows · salaries, departments', icon: '👥' },
  { name: 'ecommerce', label: 'E-commerce Data', desc: '300 rows · orders, customers', icon: '🛒' },
]

export default function DatasetPanel({ datasets, activeId, onSelect, onLoadSample, onUpload, onDelete, loading }) {
  const fileRef = useRef(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)

  async function handleFile(file) {
    if (!file || !file.name.endsWith('.csv')) return
    setUploading(true)
    try {
      const info = await onUpload(file)
      onSelect(info.id)
    } catch (e) {
      // error handled by hook
    } finally {
      setUploading(false)
    }
  }

  async function handleSample(name) {
    try {
      const info = await onLoadSample(name)
      onSelect(info.id)
    } catch (e) {
      // ignore
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-violet-400 text-lg">📊</span>
          <h1 className="text-white font-bold text-base tracking-tight">AI Data Analyst</h1>
        </div>
        <p className="text-slate-500 text-xs">Ask questions in plain English</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
        {/* Sample datasets */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Load Sample Data
          </p>
          <div className="space-y-2">
            {SAMPLES.map((s) => (
              <button
                key={s.name}
                onClick={() => handleSample(s.name)}
                disabled={loading}
                className="w-full text-left rounded-lg border border-slate-700 hover:border-violet-500 hover:bg-slate-800 p-3 transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{s.icon}</span>
                  <div>
                    <p className="text-slate-200 text-sm font-medium group-hover:text-violet-300">{s.label}</p>
                    <p className="text-slate-500 text-xs">{s.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2">
          <div className="flex-1 border-t border-slate-800" />
          <span className="text-slate-600 text-xs">or</span>
          <div className="flex-1 border-t border-slate-800" />
        </div>

        {/* Upload zone */}
        <div>
          <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
            Upload Your CSV
          </p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]) }}
            onClick={() => fileRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-violet-500 bg-violet-500/10'
                : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800/50'
            }`}
          >
            <p className="text-2xl mb-1">{uploading ? '⏳' : '📂'}</p>
            <p className="text-slate-300 text-sm font-medium">
              {uploading ? 'Processing…' : 'Drop CSV here'}
            </p>
            <p className="text-slate-500 text-xs mt-1">or click to browse · max 10 MB</p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>
        </div>

        {/* Loaded datasets */}
        {datasets.length > 0 && (
          <div>
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Loaded Datasets
            </p>
            <div className="space-y-1">
              {datasets.map((ds) => (
                <div
                  key={ds.id}
                  onClick={() => onSelect(ds.id)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 cursor-pointer transition-all group ${
                    ds.id === activeId
                      ? 'bg-violet-600/20 border border-violet-600/40'
                      : 'hover:bg-slate-800 border border-transparent'
                  }`}
                >
                  <div className="min-w-0">
                    <p className={`text-sm font-medium truncate ${ds.id === activeId ? 'text-violet-300' : 'text-slate-200'}`}>
                      {ds.name}
                    </p>
                    <p className="text-slate-500 text-xs">{ds.rows.toLocaleString()} rows · {ds.columns.length} cols</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(ds.id) }}
                    className="text-slate-600 hover:text-red-400 ml-2 opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                    title="Remove"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
