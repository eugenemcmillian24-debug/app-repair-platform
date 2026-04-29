// API client — reads backend URL from env var set at build time
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

export const api = {
  health: () => req('/health'),
  stats: () => req('/stats'),
  history: (limit = 20) => req(`/history?limit=${limit}`),
  models: () => req('/models'),
  startRepair: (body) => req('/repair', { method: 'POST', body: JSON.stringify(body) }),
  pollRepair: (jobId) => req(`/repair/${jobId}`),
}
