import { useState, useCallback } from 'react'
import { api } from '../api/client'

export function useAnalyst() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const ask = useCallback(async (datasetId, question) => {
    setLoading(true)
    setError(null)

    // Build conversation history from prior exchanges
    const conversationHistory = history.flatMap((item) => [
      { role: 'user', content: item.question },
      { role: 'assistant', content: JSON.stringify({ sql: item.sql, explanation: item.explanation }) },
    ])

    try {
      const result = await api.query({
        dataset_id: datasetId,
        question,
        conversation_history: conversationHistory,
      })

      const entry = { id: Date.now(), question, ...result, expanded: true }
      setHistory((prev) => [entry, ...prev.map((h) => ({ ...h, expanded: false }))])
      return result
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [history])

  const toggleExpand = useCallback((id) => {
    setHistory((prev) => prev.map((h) => (h.id === id ? { ...h, expanded: !h.expanded } : h)))
  }, [])

  const clearHistory = useCallback(() => {
    setHistory([])
    setError(null)
  }, [])

  return { history, loading, error, ask, toggleExpand, clearHistory }
}
