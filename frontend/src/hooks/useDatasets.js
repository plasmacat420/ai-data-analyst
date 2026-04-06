import { useState, useEffect, useCallback } from 'react'
import { api } from '../api/client'

export function useDatasets() {
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listDatasets()
      setDatasets(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const loadSample = useCallback(async (name) => {
    setLoading(true)
    setError(null)
    try {
      const info = await api.loadSample(name)
      await refresh()
      return info
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const uploadCSV = useCallback(async (file) => {
    setLoading(true)
    setError(null)
    try {
      const info = await api.uploadCSV(file)
      await refresh()
      return info
    } catch (e) {
      setError(e.message)
      throw e
    } finally {
      setLoading(false)
    }
  }, [refresh])

  const deleteDataset = useCallback(async (id) => {
    try {
      await api.deleteDataset(id)
      await refresh()
    } catch (e) {
      setError(e.message)
    }
  }, [refresh])

  return { datasets, loading, error, refresh, loadSample, uploadCSV, deleteDataset }
}
