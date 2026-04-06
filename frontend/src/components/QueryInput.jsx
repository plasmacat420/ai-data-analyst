import { useState, useRef } from 'react'
import SampleQuestions from './SampleQuestions'

export default function QueryInput({ dataset, onSubmit, loading }) {
  const [question, setQuestion] = useState('')
  const textareaRef = useRef(null)

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  function handleSubmit() {
    const q = question.trim()
    if (!q || !dataset || loading) return
    setQuestion('')
    onSubmit(q)
  }

  function handleSampleSelect(q) {
    setQuestion(q)
    textareaRef.current?.focus()
  }

  const disabled = !dataset || loading

  return (
    <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
      {!dataset && (
        <div className="mb-3 text-slate-500 text-sm text-center py-2 bg-slate-800/50 rounded-lg border border-slate-700">
          ← Select or load a dataset to start asking questions
        </div>
      )}

      <div className="flex gap-3 items-end">
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={dataset ? `Ask anything about ${dataset.name}…` : 'Ask anything about your data…'}
            disabled={disabled}
            rows={2}
            className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-3 text-sm resize-none outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={disabled || !question.trim()}
          className="flex-shrink-0 bg-violet-600 hover:bg-violet-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-medium px-5 py-3 rounded-xl text-sm transition-all disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing
            </>
          ) : (
            <>
              <span>Ask</span>
              <span className="text-violet-300">⌘↵</span>
            </>
          )}
        </button>
      </div>

      {dataset && (
        <SampleQuestions dataset={dataset} onSelect={handleSampleSelect} />
      )}
    </div>
  )
}
