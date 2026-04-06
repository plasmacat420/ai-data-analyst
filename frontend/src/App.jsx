import { useState } from 'react'
import DatasetPanel from './components/DatasetPanel'
import QueryInput from './components/QueryInput'
import ConversationHistory from './components/ConversationHistory'
import { useDatasets } from './hooks/useDatasets'
import { useAnalyst } from './hooks/useAnalyst'

export default function App() {
  const [activeDatasetId, setActiveDatasetId] = useState(null)
  const { datasets, loading: dsLoading, error: dsError, loadSample, uploadCSV, deleteDataset } = useDatasets()
  const { history, loading: queryLoading, error: queryError, ask, toggleExpand, clearHistory } = useAnalyst()

  const activeDataset = datasets.find((d) => d.id === activeDatasetId) || null

  function handleSelect(id) {
    setActiveDatasetId(id)
  }

  function handleDelete(id) {
    deleteDataset(id)
    if (id === activeDatasetId) setActiveDatasetId(null)
  }

  async function handleAsk(question) {
    if (!activeDatasetId) return
    await ask(activeDatasetId, question)
  }

  return (
    <div className="h-screen bg-slate-950 flex overflow-hidden text-slate-100">
      {/* Left sidebar */}
      <aside className="w-72 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col">
        <DatasetPanel
          datasets={datasets}
          activeId={activeDatasetId}
          onSelect={handleSelect}
          onLoadSample={loadSample}
          onUpload={uploadCSV}
          onDelete={handleDelete}
          loading={dsLoading}
        />
        {dsError && (
          <div className="px-4 pb-3 text-red-400 text-xs">
            {dsError}
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Query input — fixed at top */}
        <QueryInput
          dataset={activeDataset}
          onSubmit={handleAsk}
          loading={queryLoading}
        />

        {/* Conversation area */}
        {queryError && (
          <div className="px-6 py-2 bg-red-900/20 border-b border-red-800/30">
            <p className="text-red-400 text-sm">{queryError}</p>
          </div>
        )}

        <ConversationHistory
          history={history}
          onToggle={toggleExpand}
          onClear={clearHistory}
        />
      </main>
    </div>
  )
}
