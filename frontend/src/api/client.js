const API_BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export const api = {
  // Datasets
  listDatasets: () => request('/api/datasets'),
  getDataset: (id) => request(`/api/datasets/${id}`),
  loadSample: (name) => request(`/api/datasets/sample/${name}`, { method: 'POST' }),
  deleteDataset: (id) => request(`/api/datasets/${id}`, { method: 'DELETE' }),
  uploadCSV: (file) => {
    const form = new FormData()
    form.append('file', file)
    return fetch(`${API_BASE}/api/datasets/upload`, { method: 'POST', body: form })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({ detail: res.statusText }))
          throw new Error(err.detail || `HTTP ${res.status}`)
        }
        return res.json()
      })
  },

  // Query
  query: (payload) => request('/api/query', { method: 'POST', body: JSON.stringify(payload) }),

  // Health
  health: () => request('/health'),
}
